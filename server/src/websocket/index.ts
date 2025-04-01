import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { getDatabase } from '../database';
import { logger } from '../utils/logger';
import { verifyToken } from '../utils/auth';
import { 
  createSecureMessage, 
  verifyAndDecryptMessage,
  generateSessionKey,
  performKeyExchange
} from '../utils/encryption';
import { 
  createSession, 
  getSession, 
  endSession,
  verifySessionMessage,
  cleanupExpiredSessions
} from '../utils/session';

// Extended WebSocket interface
interface SecureWebSocket extends WebSocket {
  userId?: number;
  sessionId?: string;
  isAlive: boolean;
}

// Message types
enum MessageType {
  AUTH = 'auth',
  KEY_EXCHANGE = 'key_exchange',
  MESSAGE = 'message',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error'
}

// Message interface
interface WebSocketMessage {
  type: MessageType;
  data: any;
}

// WebSocket server configuration
const WS_CONFIG = {
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  MAX_PAYLOAD_SIZE: 1024 * 1024, // 1MB
  MAX_CONNECTIONS_PER_IP: 3,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  MAX_MESSAGES_PER_WINDOW: 100
};

// Connection tracking
const connections = new Map<number, Set<SecureWebSocket>>();
const ipConnections = new Map<string, number>();

// Create WebSocket server
export function createWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ 
    server,
    maxPayload: WS_CONFIG.MAX_PAYLOAD_SIZE,
    perMessageDeflate: false // Disable compression for security
  });

  // Handle new connections
  wss.on('connection', handleConnection);

  // Set up heartbeat interval
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws: SecureWebSocket) => {
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, WS_CONFIG.HEARTBEAT_INTERVAL);

  // Clean up expired sessions periodically
  setInterval(cleanupExpiredSessions, 60000);

  // Clean up on server close
  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  return wss;
}

// Handle new WebSocket connection
async function handleConnection(ws: SecureWebSocket, req: any) {
  try {
    // Rate limiting by IP
    const ip = req.socket.remoteAddress;
    const currentConnections = ipConnections.get(ip) || 0;
    
    if (currentConnections >= WS_CONFIG.MAX_CONNECTIONS_PER_IP) {
      ws.close(1008, 'Too many connections from this IP');
      return;
    }

    ipConnections.set(ip, currentConnections + 1);

    // Set up connection
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle messages
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        await handleMessage(ws, message);
      } catch (error) {
        logger.error('Error handling message:', error);
        sendError(ws, 'Invalid message format');
      }
    });

    // Handle connection close
    ws.on('close', async () => {
      if (ws.userId) {
        const userConnections = connections.get(ws.userId);
        if (userConnections) {
          userConnections.delete(ws);
          if (userConnections.size === 0) {
            connections.delete(ws.userId);
          }
        }
      }

      if (ws.sessionId) {
        await endSession(ws.sessionId);
      }

      const currentIPConnections = ipConnections.get(ip) || 0;
      ipConnections.set(ip, Math.max(0, currentIPConnections - 1));
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      if (ws.sessionId) {
        endSession(ws.sessionId);
      }
    });

  } catch (error) {
    logger.error('Error handling connection:', error);
    ws.close(1011, 'Internal server error');
  }
}

// Handle incoming messages
async function handleMessage(ws: SecureWebSocket, message: WebSocketMessage) {
  try {
    switch (message.type) {
      case MessageType.AUTH:
        await handleAuth(ws, message.data);
        break;
      case MessageType.KEY_EXCHANGE:
        await handleKeyExchange(ws, message.data);
        break;
      case MessageType.MESSAGE:
        await handleChatMessage(ws, message.data);
        break;
      case MessageType.PING:
        ws.send(JSON.stringify({ type: MessageType.PONG }));
        break;
      default:
        sendError(ws, 'Unknown message type');
    }
  } catch (error) {
    logger.error('Error handling message:', error);
    sendError(ws, 'Failed to process message');
  }
}

// Handle authentication
async function handleAuth(ws: SecureWebSocket, data: any) {
  try {
    const { token } = data;
    if (!token) {
      sendError(ws, 'Missing authentication token');
      return;
    }

    const decoded = await verifyToken(token);
    ws.userId = decoded.userId;

    // Create user connections set if it doesn't exist
    if (!connections.has(ws.userId)) {
      connections.set(ws.userId, new Set());
    }
    connections.get(ws.userId)?.add(ws);

    // Generate session key
    const sessionKey = generateSessionKey();
    const session = await createSession(ws.userId, Buffer.from(decoded.publicKey), sessionKey);

    ws.sessionId = session.id;

    // Send success response
    ws.send(JSON.stringify({
      type: MessageType.AUTH,
      data: { success: true }
    }));

  } catch (error) {
    logger.error('Authentication error:', error);
    sendError(ws, 'Authentication failed');
  }
}

// Handle key exchange
async function handleKeyExchange(ws: SecureWebSocket, data: any) {
  try {
    const { publicKey } = data;
    if (!publicKey || !ws.userId) {
      sendError(ws, 'Invalid key exchange request');
      return;
    }

    const session = getSession(ws.sessionId!);
    if (!session) {
      sendError(ws, 'Invalid session');
      return;
    }

    const sharedSecret = await performKeyExchange(
      Buffer.from(session.sessionKey),
      Buffer.from(publicKey)
    );

    // Update session key
    await updateSessionKey(ws.sessionId!, sharedSecret);

    // Send success response
    ws.send(JSON.stringify({
      type: MessageType.KEY_EXCHANGE,
      data: { success: true }
    }));

  } catch (error) {
    logger.error('Key exchange error:', error);
    sendError(ws, 'Key exchange failed');
  }
}

// Handle chat messages
async function handleChatMessage(ws: SecureWebSocket, data: any) {
  try {
    const { recipientId, message } = data;
    if (!recipientId || !message || !ws.userId) {
      sendError(ws, 'Invalid message format');
      return;
    }

    const session = getSession(ws.sessionId!);
    if (!session) {
      sendError(ws, 'Invalid session');
      return;
    }

    // Verify message
    const isValid = await verifySessionMessage(ws.sessionId!, message);
    if (!isValid) {
      sendError(ws, 'Invalid message signature');
      return;
    }

    // Decrypt message
    const decryptedMessage = await verifyAndDecryptMessage(
      message,
      session.sessionKey,
      session.publicKey
    );

    // Get recipient's connections
    const recipientConnections = connections.get(recipientId);
    if (!recipientConnections) {
      sendError(ws, 'Recipient not found');
      return;
    }

    // Forward message to recipient
    const secureMessage = await createSecureMessage(
      decryptedMessage,
      session.sessionKey,
      session.publicKey
    );

    const messageData = {
      senderId: ws.userId,
      message: secureMessage
    };

    recipientConnections.forEach(client => {
      client.send(JSON.stringify({
        type: MessageType.MESSAGE,
        data: messageData
      }));
    });

  } catch (error) {
    logger.error('Error handling chat message:', error);
    sendError(ws, 'Failed to process message');
  }
}

// Send error message to client
function sendError(ws: SecureWebSocket, message: string) {
  ws.send(JSON.stringify({
    type: MessageType.ERROR,
    data: { message }
  }));
} 
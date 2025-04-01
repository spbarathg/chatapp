import { randomBytes } from 'crypto';
import { getDatabase } from '../database';
import { logger } from './logger';
import { SecureMessage } from './encryption';

// Session interface
export interface Session {
  id: string;
  userId: number;
  publicKey: Buffer;
  sessionKey: Buffer;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
}

// Session store (in-memory for ephemeral storage)
const sessions = new Map<string, Session>();

// Session configuration
const SESSION_CONFIG = {
  SESSION_ID_LENGTH: 32,
  SESSION_KEY_LENGTH: 32,
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  MAX_SESSIONS_PER_USER: 3,
  INACTIVITY_TIMEOUT: 30 * 60 * 1000 // 30 minutes
};

// Generate a secure session ID
function generateSessionId(): string {
  return randomBytes(SESSION_CONFIG.SESSION_ID_LENGTH).toString('hex');
}

// Create a new session
export async function createSession(
  userId: number,
  publicKey: Buffer,
  sessionKey: Buffer
): Promise<Session> {
  try {
    // Check for existing sessions
    const existingSessions = Array.from(sessions.values())
      .filter(s => s.userId === userId);

    // Remove oldest session if limit reached
    if (existingSessions.length >= SESSION_CONFIG.MAX_SESSIONS_PER_USER) {
      const oldestSession = existingSessions.reduce((a, b) => 
        a.lastActivity < b.lastActivity ? a : b
      );
      sessions.delete(oldestSession.id);
    }

    const session: Session = {
      id: generateSessionId(),
      userId,
      publicKey,
      sessionKey,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + SESSION_CONFIG.SESSION_DURATION
    };

    sessions.set(session.id, session);

    // Log security event
    await logSecurityEvent(userId, 'session_created', {
      sessionId: session.id,
      ip: '127.0.0.1' // Replace with actual IP
    });

    return session;
  } catch (error) {
    logger.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
}

// Get session by ID
export function getSession(sessionId: string): Session | undefined {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return undefined;
  }

  // Check if session is expired
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return undefined;
  }

  // Check for inactivity
  if (Date.now() - session.lastActivity > SESSION_CONFIG.INACTIVITY_TIMEOUT) {
    sessions.delete(sessionId);
    return undefined;
  }

  // Update last activity
  session.lastActivity = Date.now();
  return session;
}

// End session
export async function endSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (session) {
    sessions.delete(sessionId);
    
    // Log security event
    await logSecurityEvent(session.userId, 'session_ended', {
      sessionId,
      duration: Date.now() - session.createdAt
    });
  }
}

// End all sessions for a user
export async function endAllUserSessions(userId: number): Promise<void> {
  const userSessions = Array.from(sessions.values())
    .filter(s => s.userId === userId);

  for (const session of userSessions) {
    await endSession(session.id);
  }
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt || 
        now - session.lastActivity > SESSION_CONFIG.INACTIVITY_TIMEOUT) {
      await endSession(sessionId);
    }
  }
}

// Verify session message
export async function verifySessionMessage(
  sessionId: string,
  message: SecureMessage
): Promise<boolean> {
  const session = getSession(sessionId);
  if (!session) {
    return false;
  }

  try {
    // Verify message timestamp
    if (message.timestamp < session.lastActivity) {
      return false;
    }

    // Verify message signature
    const isValid = await verifySignature(
      message.encrypted,
      message.signature,
      session.publicKey
    );

    return isValid;
  } catch (error) {
    logger.error('Error verifying session message:', error);
    return false;
  }
}

// Update session key
export async function updateSessionKey(
  sessionId: string,
  newSessionKey: Buffer
): Promise<void> {
  const session = getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.sessionKey = newSessionKey;
  session.lastActivity = Date.now();

  // Log security event
  await logSecurityEvent(session.userId, 'session_key_updated', {
    sessionId
  });
}

// Get active sessions for a user
export function getActiveUserSessions(userId: number): Session[] {
  return Array.from(sessions.values())
    .filter(s => s.userId === userId);
}

// Validate session activity
export function validateSessionActivity(sessionId: string): boolean {
  const session = getSession(sessionId);
  if (!session) {
    return false;
  }

  return Date.now() - session.lastActivity <= SESSION_CONFIG.INACTIVITY_TIMEOUT;
}

// Log security event
async function logSecurityEvent(
  userId: number,
  eventType: string,
  details: any
): Promise<void> {
  const db = getDatabase();
  await db.run(
    `INSERT INTO security_events (user_id, event_type, details, ip_address)
     VALUES (?, ?, ?, ?)`,
    [userId, eventType, JSON.stringify(details), '127.0.0.1'] // Replace with actual IP
  );
} 
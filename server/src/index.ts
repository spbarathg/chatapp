import express from 'express';
import http from 'http';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import ws from 'ws';
import { initializeDatabase } from './database';
import { logger } from './utils/logger';
import { initializeMonitoring } from './utils/monitoring';
import { authRoutes, userRoutes, messageRoutes } from './routes';
import { createWebSocketServer } from './websocket/server';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

const app = express();
const server = http.createServer(app);
const wss = new ws.Server({ server });

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.window,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Error handling
app.use(errorHandler);

// Initialize services
const db = initializeDatabase();
initializeMonitoring();
createWebSocketServer(wss);

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
}); 
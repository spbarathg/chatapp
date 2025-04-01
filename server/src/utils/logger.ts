import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { EventEmitter } from 'events';
import { createHash } from 'crypto';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const transports = [
  new winston.transports.Console(),
  new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
    format
  }),
  new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format
  })
];

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels: logLevels,
  format,
  transports
});

const eventEmitter = new EventEmitter();

function hashSensitiveData(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function sanitizeMetadata(metadata: any): any {
  if (!metadata) return metadata;

  const sensitiveFields = ['ip', 'userAgent', 'username', 'email', 'token', 'password'];
  const sanitized = { ...metadata };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = hashSensitiveData(sanitized[field]);
    }
  }

  return sanitized;
}

const securityLogger = {
  auth: (message: string, metadata?: any) => {
    logger.info(`[AUTH] ${message}`, { metadata: sanitizeMetadata(metadata) });
  },
  access: (message: string, metadata?: any) => {
    logger.info(`[ACCESS] ${message}`, { metadata: sanitizeMetadata(metadata) });
  },
  audit: (message: string, metadata?: any) => {
    logger.info(`[AUDIT] ${message}`, { metadata: sanitizeMetadata(metadata) });
  },
  error: (message: string, metadata?: any) => {
    logger.error(`[SECURITY] ${message}`, { metadata: sanitizeMetadata(metadata) });
  }
};

const requestLogger = (req: any, res: any, next: any) => {
  const metadata = {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    method: req.method,
    url: req.url,
    status: res.statusCode
  };

  logger.http(`${req.method} ${req.url}`, { metadata: sanitizeMetadata(metadata) });
  next();
};

const errorLogger = (err: any, req: any, res: any, next: any) => {
  const metadata = {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    method: req.method,
    url: req.url,
    error: err.message
  };

  logger.error(err.stack || err.message, { metadata: sanitizeMetadata(metadata) });
  next(err);
};

function subscribeToLogs(callback: (log: any) => void): void {
  eventEmitter.on('log', callback);
}

function unsubscribeFromLogs(callback: (log: any) => void): void {
  eventEmitter.off('log', callback);
}

function subscribeToSecurityLogs(callback: (log: any) => void): void {
  eventEmitter.on('securityLog', callback);
}

function unsubscribeFromSecurityLogs(callback: (log: any) => void): void {
  eventEmitter.off('securityLog', callback);
}

export {
  logger,
  securityLogger,
  requestLogger,
  errorLogger,
  subscribeToLogs,
  unsubscribeFromLogs,
  subscribeToSecurityLogs,
  unsubscribeFromSecurityLogs
}; 
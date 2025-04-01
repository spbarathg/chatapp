import { getDatabase } from '../database';
import { logger } from './logger';
import { EventEmitter } from 'events';
import { createHash } from 'crypto';

// Monitoring configuration
const MONITORING_CONFIG = {
  CHECK_INTERVAL: 60000, // 1 minute
  ALERT_THRESHOLDS: {
    FAILED_LOGINS: 5,
    FAILED_REQUESTS: 100,
    CONCURRENT_CONNECTIONS: 1000,
    MEMORY_USAGE: 0.9, // 90%
    CPU_USAGE: 0.8 // 80%
  },
  RETENTION_DAYS: 30
};

// Security event types
export enum SecurityEventType {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

// System metrics interface
interface SystemMetrics {
  timestamp: string;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  failedLogins: number;
  failedRequests: number;
  databaseSize: number;
}

// Security alert interface
interface SecurityAlert {
  id: number;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  resolved: boolean;
}

// Create event emitter for monitoring events
const eventEmitter = new EventEmitter();

// Hash sensitive data
function hashSensitiveData(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// Anonymize alert details
function anonymizeAlertDetails(details: any): any {
  if (!details) return details;

  const sensitiveFields = ['ip', 'userAgent', 'username', 'email', 'token', 'password'];
  const anonymized = { ...details };

  for (const field of sensitiveFields) {
    if (field in anonymized) {
      anonymized[field] = hashSensitiveData(String(anonymized[field]));
    }
  }

  return anonymized;
}

// Initialize monitoring system
export async function initializeMonitoring(): Promise<void> {
  const db = getDatabase();
  
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        memory_usage REAL NOT NULL,
        cpu_usage REAL NOT NULL,
        active_connections INTEGER NOT NULL,
        failed_logins INTEGER NOT NULL,
        failed_requests INTEGER NOT NULL,
        database_size INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS security_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        resolved INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON system_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON security_alerts(timestamp);
    `);

    // Start monitoring intervals
    setInterval(collectMetrics, MONITORING_CONFIG.CHECK_INTERVAL);
    setInterval(cleanupOldData, 24 * 60 * 60 * 1000); // Daily cleanup

    logger.info('Monitoring system initialized');
  } catch (error) {
    logger.error('Failed to initialize monitoring:', error);
    throw error;
  }
}

// Collect system metrics
async function collectMetrics(): Promise<void> {
  try {
    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
      cpuUsage: process.cpuUsage().user / 1000000,
      activeConnections: (global as any).activeConnections || 0,
      failedLogins: (global as any).failedLogins || 0,
      failedRequests: (global as any).failedRequests || 0,
      databaseSize: await getDatabaseSize()
    };

    await storeMetrics(metrics);
    await checkThresholds(metrics);
  } catch (error) {
    logger.error('Failed to collect metrics:', error);
  }
}

// Store system metrics
async function storeMetrics(metrics: SystemMetrics): Promise<void> {
  const db = getDatabase();
  await db.run(`
    INSERT INTO system_metrics (
      timestamp, memory_usage, cpu_usage, active_connections,
      failed_logins, failed_requests, database_size
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    metrics.timestamp,
    metrics.memoryUsage,
    metrics.cpuUsage,
    metrics.activeConnections,
    metrics.failedLogins,
    metrics.failedRequests,
    metrics.databaseSize
  ]);
}

// Check metrics against thresholds
async function checkThresholds(metrics: SystemMetrics): Promise<void> {
  const { ALERT_THRESHOLDS } = MONITORING_CONFIG;

  if (metrics.failedLogins >= ALERT_THRESHOLDS.FAILED_LOGINS) {
    await createAlert(
      SecurityEventType.LOGIN_FAILURE,
      'high',
      `Multiple failed login attempts detected: ${metrics.failedLogins}`
    );
  }

  if (metrics.failedRequests >= ALERT_THRESHOLDS.FAILED_REQUESTS) {
    await createAlert(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      'medium',
      `High number of failed requests: ${metrics.failedRequests}`
    );
  }

  if (metrics.activeConnections >= ALERT_THRESHOLDS.CONCURRENT_CONNECTIONS) {
    await createAlert(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      'high',
      `High number of concurrent connections: ${metrics.activeConnections}`
    );
  }

  if (metrics.memoryUsage >= ALERT_THRESHOLDS.MEMORY_USAGE) {
    await createAlert(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      'medium',
      `High memory usage: ${(metrics.memoryUsage * 100).toFixed(2)}%`
    );
  }

  if (metrics.cpuUsage >= ALERT_THRESHOLDS.CPU_USAGE) {
    await createAlert(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      'medium',
      `High CPU usage: ${(metrics.cpuUsage * 100).toFixed(2)}%`
    );
  }
}

// Create security alert
async function createAlert(
  type: SecurityEventType,
  severity: 'low' | 'medium' | 'high',
  message: string
): Promise<void> {
  const db = getDatabase();
  const timestamp = new Date().toISOString();
  
  await db.run(`
    INSERT INTO security_alerts (type, severity, message, timestamp)
    VALUES (?, ?, ?, ?)
  `, [type, severity, message, timestamp]);

  eventEmitter.emit('securityAlert', { type, severity, message, timestamp });
}

// Clean up old monitoring data
async function cleanupOldData(): Promise<void> {
  const db = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MONITORING_CONFIG.RETENTION_DAYS);
  
  try {
    await db.run(`
      DELETE FROM system_metrics
      WHERE datetime(timestamp) < datetime(?)
    `, [cutoffDate.toISOString()]);

    await db.run(`
      DELETE FROM security_alerts
      WHERE datetime(timestamp) < datetime(?)
    `, [cutoffDate.toISOString()]);

    logger.info('Old monitoring data cleaned up');
  } catch (error) {
    logger.error('Failed to cleanup old monitoring data:', error);
  }
}

// Get recent system metrics
async function getRecentMetrics(hours: number = 24): SystemMetrics[] {
  const db = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);
  
  return db.all(`
    SELECT * FROM system_metrics
    WHERE datetime(timestamp) > datetime(?)
    ORDER BY timestamp DESC
  `, [cutoffDate.toISOString()]);
}

// Get active security alerts
async function getActiveAlerts(): Promise<SecurityAlert[]> {
  const db = getDatabase();
  return db.all(`
    SELECT * FROM security_alerts
    WHERE resolved = 0
    ORDER BY timestamp DESC
  `);
}

// Resolve security alert
async function resolveAlert(id: number): Promise<void> {
  const db = getDatabase();
  await db.run(`
    UPDATE security_alerts
    SET resolved = 1
    WHERE id = ?
  `, [id]);
}

// Subscribe to security alerts
function subscribeToAlerts(callback: (alert: SecurityAlert) => void): void {
  eventEmitter.on('securityAlert', callback);
}

function unsubscribeFromAlerts(callback: (alert: SecurityAlert) => void): void {
  eventEmitter.off('securityAlert', callback);
}

export {
  initializeMonitoring,
  SecurityEventType,
  SystemMetrics,
  SecurityAlert,
  getRecentMetrics,
  getActiveAlerts,
  resolveAlert,
  subscribeToAlerts,
  unsubscribeFromAlerts
}; 
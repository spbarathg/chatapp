import { randomBytes, createHash } from 'crypto';
import { getDatabase } from '../database';
import { logger } from './logger';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 100;
const MAX_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

// Password validation
export function validatePassword(password: string): boolean {
  // Minimum length
  if (password.length < 12) return false;
  
  // Complexity requirements
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return false;
  }
  
  // Check against common passwords
  const commonPasswords = ['password123', '12345678', 'qwerty123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return false;
  }
  
  return true;
}

// Generate secure nonce
export function generateNonce(): string {
  return randomBytes(32).toString('hex');
}

// Generate MAC for message
export function generateMAC(message: string, key: string): string {
  return createHash('sha256')
    .update(message + key)
    .digest('hex');
}

// Verify MAC
export function verifyMAC(message: string, key: string, mac: string): boolean {
  const expectedMAC = generateMAC(message, key);
  return expectedMAC === mac;
}

// Rate limiting
export async function checkRateLimit(ip: string, endpoint: string): Promise<boolean> {
  const db = getDatabase();
  const now = new Date();
  
  // Clean up old rate limit records
  await db.run(`
    DELETE FROM rate_limits 
    WHERE window_start < datetime('now', '-15 minutes')
  `);
  
  // Get current rate limit
  const rateLimit = await db.get(`
    SELECT * FROM rate_limits 
    WHERE ip_address = ? AND endpoint = ?
  `, [ip, endpoint]);
  
  if (!rateLimit) {
    // Create new rate limit record
    await db.run(`
      INSERT INTO rate_limits (ip_address, endpoint, request_count, window_start)
      VALUES (?, ?, 1, datetime('now'))
    `, [ip, endpoint]);
    return true;
  }
  
  if (rateLimit.request_count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  // Increment request count
  await db.run(`
    UPDATE rate_limits 
    SET request_count = request_count + 1
    WHERE ip_address = ? AND endpoint = ?
  `, [ip, endpoint]);
  
  return true;
}

// Brute force protection
export async function handleFailedLogin(userId: number, ip: string): Promise<void> {
  const db = getDatabase();
  
  // Update failed login attempts
  await db.run(`
    UPDATE users 
    SET failed_login_attempts = failed_login_attempts + 1,
        last_failed_login = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [userId]);
  
  // Get current failed attempts
  const user = await db.get('SELECT failed_login_attempts FROM users WHERE id = ?', [userId]);
  
  // Log security event
  await db.run(`
    INSERT INTO security_events (user_id, event_type, event_data, ip_address)
    VALUES (?, 'failed_login', ?, ?)
  `, [userId, JSON.stringify({ attempts: user.failed_login_attempts }), ip]);
  
  // Lock account if too many attempts
  if (user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS) {
    const lockUntil = new Date(Date.now() + ACCOUNT_LOCK_DURATION);
    await db.run(`
      UPDATE users 
      SET account_locked_until = datetime(?, 'unixepoch')
      WHERE id = ?
    `, [Math.floor(lockUntil.getTime() / 1000), userId]);
    
    logger.warn(`Account ${userId} locked until ${lockUntil.toISOString()}`);
  }
}

// Reset failed login attempts
export async function resetFailedLoginAttempts(userId: number): Promise<void> {
  const db = getDatabase();
  await db.run(`
    UPDATE users 
    SET failed_login_attempts = 0,
        account_locked_until = NULL
    WHERE id = ?
  `, [userId]);
}

// Check if account is locked
export async function isAccountLocked(userId: number): Promise<boolean> {
  const db = getDatabase();
  const user = await db.get(`
    SELECT account_locked_until 
    FROM users 
    WHERE id = ?
  `, [userId]);
  
  if (!user || !user.account_locked_until) return false;
  
  const lockUntil = new Date(user.account_locked_until);
  if (lockUntil > new Date()) {
    return true;
  }
  
  // Reset lock if expired
  await resetFailedLoginAttempts(userId);
  return false;
}

// Generate backup key
export function generateBackupKey(): string {
  return randomBytes(32).toString('hex');
}

// Hash backup data
export function hashBackupData(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// Validate backup integrity
export function validateBackupIntegrity(data: string, hash: string): boolean {
  return hashBackupData(data) === hash;
}

// Clean up expired messages
export async function cleanupExpiredMessages(): Promise<void> {
  const db = getDatabase();
  await db.run(`
    DELETE FROM message_retention 
    WHERE expires_at < datetime('now')
  `);
}

// Log security event
export async function logSecurityEvent(
  userId: number | null,
  eventType: string,
  eventData: any,
  ipAddress: string
): Promise<void> {
  const db = getDatabase();
  await db.run(`
    INSERT INTO security_events (user_id, event_type, event_data, ip_address)
    VALUES (?, ?, ?, ?)
  `, [userId, eventType, JSON.stringify(eventData), ipAddress]);
} 
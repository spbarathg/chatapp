import { randomBytes, createHash, createHmac } from 'crypto';
import { getDatabase } from '../database';
import { logger } from './logger';
import { promisify } from 'util';

const scrypt = promisify(require('crypto').scrypt);
const SALT_ROUNDS = 10;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

export interface TokenPayload {
  userId: number;
  username: string;
}

// Password validation
export function validatePassword(password: string): boolean {
  // Minimum length check
  if (password.length < 12) {
    return false;
  }

  // Complexity requirements
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return false;
  }

  // Common password check
  const commonPasswords = [
    'password123', '12345678', 'qwerty123', 'admin123',
    'letmein123', 'welcome123', 'monkey123', 'football123'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    return false;
  }

  return true;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

// Password verification
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  const derivedKey = await scrypt(password, salt, 64);
  return key === derivedKey.toString('hex');
}

// JWT token generation
export function generateToken(payload: any): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', process.env.JWT_SECRET || 'your-secret-key')
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// JWT token verification
export async function verifyToken(token: string): Promise<any> {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString());
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());

    // Verify signature
    const expectedSignature = createHmac('sha256', process.env.JWT_SECRET || 'your-secret-key')
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    // Verify token expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Brute force protection
export async function handleFailedLogin(userId: number, ip: string): Promise<void> {
  const db = getDatabase();
  
  // Increment failed attempts
  await db.run(
    'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?',
    [userId]
  );

  // Log security event
  await logSecurityEvent(userId, 'failed_login', { ip }, ip);

  // Check if account should be locked
  const user = await db.get(
    'SELECT failed_login_attempts FROM users WHERE id = ?',
    [userId]
  );

  if (user.failed_login_attempts >= 5) {
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes
    await db.run(
      'UPDATE users SET account_locked_until = datetime(?, ?) WHERE id = ?',
      [new Date(Date.now() + lockoutDuration).toISOString(), 'unixepoch', userId]
    );

    // Log security event
    await logSecurityEvent(userId, 'account_locked', { duration: lockoutDuration }, ip);
  }
}

export async function resetFailedLoginAttempts(userId: number): Promise<void> {
  const db = getDatabase();
  await db.run(
    'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = ?',
    [userId]
  );
}

export async function isAccountLocked(userId: number): Promise<boolean> {
  const db = getDatabase();
  const user = await db.get(
    'SELECT account_locked_until FROM users WHERE id = ?',
    [userId]
  );

  if (!user.account_locked_until) {
    return false;
  }

  const lockoutTime = new Date(user.account_locked_until).getTime();
  return Date.now() < lockoutTime;
}

// Security event logging
export async function logSecurityEvent(
  userId: number | null,
  eventType: string,
  details: any,
  ip: string
): Promise<void> {
  const db = getDatabase();
  await db.run(
    `INSERT INTO security_events (user_id, event_type, details, ip_address)
     VALUES (?, ?, ?, ?)`,
    [userId, eventType, JSON.stringify(details), ip]
  );
}

// Backup key generation
export function generateBackupKey(): string {
  return randomBytes(32).toString('hex');
}

// Backup data hashing
export function hashBackupData(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// Backup integrity validation
export function validateBackupIntegrity(data: string, hash: string): boolean {
  const calculatedHash = hashBackupData(data);
  return calculatedHash === hash;
} 
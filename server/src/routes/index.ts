import { Express } from 'express';
import { getDatabase } from '../database';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  verifyToken,
  validatePassword,
  handleFailedLogin,
  resetFailedLoginAttempts,
  isAccountLocked,
  logSecurityEvent
} from '../utils/auth';
import { logger } from '../utils/logger';

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export function setupRoutes(app: Express) {
  // Register endpoint
  app.post('/api/register', async (req, res) => {
    try {
      const { username, password, publicKey } = req.body;

      if (!username || !password || !publicKey) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate password strength
      if (!validatePassword(password)) {
        return res.status(400).json({ 
          error: 'Password does not meet security requirements' 
        });
      }

      const db = getDatabase();
      const passwordHash = await hashPassword(password);

      await db.run(
        'INSERT INTO users (username, password_hash, public_key) VALUES (?, ?, ?)',
        [username, passwordHash, publicKey]
      );

      // Log security event
      await logSecurityEvent(
        null,
        'user_registered',
        { username },
        req.ip
      );

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const db = getDatabase();
      const user = await db.get(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if account is locked
      const locked = await isAccountLocked(user.id);
      if (locked) {
        return res.status(403).json({ error: 'Account is temporarily locked' });
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        // Handle failed login
        await handleFailedLogin(user.id, req.ip);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Reset failed login attempts on successful login
      await resetFailedLoginAttempts(user.id);

      const token = generateToken({
        userId: user.id,
        username: user.username
      });

      // Log security event
      await logSecurityEvent(
        user.id,
        'login_success',
        {},
        req.ip
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          publicKey: user.public_key
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  // Get user's public key
  app.get('/api/users/:userId/key', authenticateToken, async (req, res) => {
    try {
      const db = getDatabase();
      const user = await db.get(
        'SELECT public_key FROM users WHERE id = ?',
        [req.params.userId]
      );

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log security event
      await logSecurityEvent(
        req.user.userId,
        'key_retrieved',
        { targetUserId: req.params.userId },
        req.ip
      );

      res.json({ publicKey: user.public_key });
    } catch (error) {
      logger.error('Error fetching user key:', error);
      res.status(500).json({ error: 'Failed to fetch user key' });
    }
  });

  // Get online users
  app.get('/api/users/online', authenticateToken, async (req, res) => {
    try {
      const db = getDatabase();
      const users = await db.all(
        `SELECT id, username, last_seen 
         FROM users 
         WHERE last_seen > datetime('now', '-5 minutes')
         AND id != ?`,
        [req.user.userId]
      );

      // Log security event
      await logSecurityEvent(
        req.user.userId,
        'online_users_retrieved',
        {},
        req.ip
      );

      res.json(users);
    } catch (error) {
      logger.error('Error fetching online users:', error);
      res.status(500).json({ error: 'Failed to fetch online users' });
    }
  });

  // Update security settings
  app.put('/api/users/security-settings', authenticateToken, async (req, res) => {
    try {
      const { twoFactorEnabled, dataRetentionDays } = req.body;
      const db = getDatabase();

      await db.run(
        `UPDATE users 
         SET two_factor_enabled = ?,
             data_retention_days = ?,
             security_settings = ?
         WHERE id = ?`,
        [
          twoFactorEnabled,
          dataRetentionDays,
          JSON.stringify(req.body),
          req.user.userId
        ]
      );

      // Log security event
      await logSecurityEvent(
        req.user.userId,
        'security_settings_updated',
        { settings: req.body },
        req.ip
      );

      res.json({ message: 'Security settings updated successfully' });
    } catch (error) {
      logger.error('Error updating security settings:', error);
      res.status(500).json({ error: 'Failed to update security settings' });
    }
  });

  // Generate backup
  app.post('/api/backup', authenticateToken, async (req, res) => {
    try {
      const db = getDatabase();
      const backupKey = generateBackupKey();
      
      // Store backup key
      await db.run(
        'UPDATE users SET backup_key = ? WHERE id = ?',
        [backupKey, req.user.userId]
      );

      // Log security event
      await logSecurityEvent(
        req.user.userId,
        'backup_generated',
        {},
        req.ip
      );

      res.json({ backupKey });
    } catch (error) {
      logger.error('Error generating backup:', error);
      res.status(500).json({ error: 'Failed to generate backup' });
    }
  });
} 
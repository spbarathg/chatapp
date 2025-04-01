import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

let db: Database | null = null;

// Database configuration
const DB_CONFIG = {
  filename: path.join(__dirname, '../../data/chat.db'),
  directory: path.join(__dirname, '../../data'),
  journalMode: 'WAL', // Write-Ahead Logging for better concurrency
  synchronous: 'NORMAL', // Faster writes while maintaining durability
  cacheSize: -2000, // Use 2MB of memory for cache
  pageSize: 4096,
  timeout: 5000
};

// Initialize database
export async function initializeDatabase(): Promise<void> {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DB_CONFIG.directory)) {
      fs.mkdirSync(DB_CONFIG.directory, { recursive: true });
    }

    // Open database connection
    db = await open({
      filename: DB_CONFIG.filename,
      driver: sqlite3.Database
    });

    // Configure database settings
    await db.exec(`
      PRAGMA journal_mode = '${DB_CONFIG.journalMode}';
      PRAGMA synchronous = '${DB_CONFIG.synchronous}';
      PRAGMA cache_size = ${DB_CONFIG.cacheSize};
      PRAGMA page_size = ${DB_CONFIG.pageSize};
      PRAGMA busy_timeout = ${DB_CONFIG.timeout};
      PRAGMA foreign_keys = ON;
    `);

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema in a transaction
    await db.exec('BEGIN TRANSACTION');
    await db.exec(schema);
    await db.exec('COMMIT');

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Error initializing database:', error);
    throw new Error('Failed to initialize database');
  }
}

// Get database instance
export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  if (db) {
    try {
      await db.close();
      db = null;
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database:', error);
      throw new Error('Failed to close database');
    }
  }
}

// Backup database
export async function backupDatabase(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const backupPath = `${DB_CONFIG.filename}.backup`;
    
    // Create backup using SQLite's backup API
    const backupDb = await open({
      filename: backupPath,
      driver: sqlite3.Database
    });

    const sourceDb = db.getDatabaseInstance();
    const backup = sourceDb.backup(backupDb.getDatabaseInstance());

    await new Promise<void>((resolve, reject) => {
      backup.step(-1, (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    await backupDb.close();
    logger.info('Database backup created successfully');
  } catch (error) {
    logger.error('Error creating database backup:', error);
    throw new Error('Failed to create database backup');
  }
}

// Restore database from backup
export async function restoreDatabase(): Promise<void> {
  const backupPath = `${DB_CONFIG.filename}.backup`;
  
  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup file not found');
  }

  try {
    // Close current connection
    await closeDatabase();

    // Copy backup file to database location
    fs.copyFileSync(backupPath, DB_CONFIG.filename);

    // Reinitialize database
    await initializeDatabase();
    
    logger.info('Database restored successfully');
  } catch (error) {
    logger.error('Error restoring database:', error);
    throw new Error('Failed to restore database');
  }
}

// Vacuum database to reclaim space
export async function vacuumDatabase(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    await db.exec('VACUUM');
    logger.info('Database vacuumed successfully');
  } catch (error) {
    logger.error('Error vacuuming database:', error);
    throw new Error('Failed to vacuum database');
  }
}

// Check database integrity
export async function checkDatabaseIntegrity(): Promise<boolean> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = await db.get<{ integrity_check: string }>(
      'PRAGMA integrity_check'
    );
    return result.integrity_check === 'ok';
  } catch (error) {
    logger.error('Error checking database integrity:', error);
    return false;
  }
}

// Initialize database on module load
initializeDatabase().catch(error => {
  logger.error('Failed to initialize database:', error);
  process.exit(1);
}); 
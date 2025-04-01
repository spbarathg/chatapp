-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username_hash TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    public_key TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    encrypted_timestamp TEXT NOT NULL,
    encrypted_security_settings TEXT NOT NULL,
    encrypted_metadata TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    encrypted_session_key TEXT NOT NULL,
    encrypted_timestamp TEXT NOT NULL,
    hashed_ip TEXT NOT NULL,
    hashed_user_agent TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    encrypted_content TEXT NOT NULL,
    encrypted_nonce TEXT NOT NULL,
    encrypted_auth_tag TEXT NOT NULL,
    encrypted_timestamp TEXT NOT NULL,
    encrypted_metadata TEXT NOT NULL,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Security events table
CREATE TABLE IF NOT EXISTS security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    encrypted_event_type TEXT NOT NULL,
    encrypted_event_details TEXT NOT NULL,
    hashed_ip TEXT NOT NULL,
    encrypted_timestamp TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Message retention table
CREATE TABLE IF NOT EXISTS message_retention (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    encrypted_retention_period TEXT NOT NULL,
    encrypted_timestamp TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Backup history table
CREATE TABLE IF NOT EXISTS backup_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    encrypted_backup_data TEXT NOT NULL,
    encrypted_timestamp TEXT NOT NULL,
    encrypted_expiration TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hashed_ip TEXT NOT NULL,
    request_count INTEGER NOT NULL,
    window_start TEXT NOT NULL,
    encrypted_metadata TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(hashed_ip);

-- Triggers
CREATE TRIGGER IF NOT EXISTS cleanup_expired_sessions
AFTER INSERT ON sessions
BEGIN
    DELETE FROM sessions 
    WHERE datetime(encrypted_timestamp) < datetime('now', '-24 hours');
END;

CREATE TRIGGER IF NOT EXISTS cleanup_expired_messages
AFTER INSERT ON messages
BEGIN
    DELETE FROM messages 
    WHERE datetime(encrypted_timestamp) < datetime('now', '-30 days');
END;

CREATE TRIGGER IF NOT EXISTS cleanup_expired_backups
AFTER INSERT ON backup_history
BEGIN
    DELETE FROM backup_history 
    WHERE datetime(encrypted_expiration) < datetime('now');
END;

CREATE TRIGGER IF NOT EXISTS cleanup_expired_rate_limits
AFTER INSERT ON rate_limits
BEGIN
    DELETE FROM rate_limits 
    WHERE datetime(window_start) < datetime('now', '-15 minutes');
END;

-- Views
CREATE VIEW IF NOT EXISTS active_sessions AS
SELECT 
    s.id,
    s.user_id,
    s.hashed_ip,
    s.hashed_user_agent
FROM sessions s
WHERE datetime(s.encrypted_timestamp) > datetime('now', '-24 hours');

CREATE VIEW IF NOT EXISTS security_audit_log AS
SELECT 
    se.id,
    se.user_id,
    se.hashed_ip,
    se.encrypted_timestamp
FROM security_events se
ORDER BY datetime(se.encrypted_timestamp) DESC; 
# Secure Private Chat Server

A secure, end-to-end encrypted private chat application backend built with Node.js, Express, Socket.IO, and SQLite. This server implements a robust security-first architecture that ensures message privacy and user data protection through zero-knowledge design and perfect forward secrecy.

## Security Guarantees

### Zero-Knowledge Architecture
- Server operates in zero-knowledge mode, handling only encrypted data
- No plaintext messages or decrypted data ever stored or processed
- Minimal metadata collection and storage
- Server-side hashing with Argon2 for authentication tokens
- Perfect Forward Secrecy (PFS) with ephemeral session keys

### End-to-End Encryption (E2EE)
- Client-side encryption using libsodium
- Curve25519 for key exchange
- XSalsa20-Poly1305 for message encryption
- Unique nonces for every message
- Message Authentication Code (MAC) for integrity verification
- Encryption/decryption strictly client-side
- Private keys never transmitted to server

### Infrastructure Security
- Self-hosted VPS with SSH key-based authentication
- Full disk encryption
- Nginx reverse proxy with Let's Encrypt SSL
- HTTPS with HSTS enabled
- Strict firewall rules
- Regular security updates and patches
- Intrusion detection (Fail2ban)

### Communication Security
- WSS (WebSockets over TLS)
- Strict Content Security Policy (CSP)
- Secure IPC communication
- Minimized connection metadata
- Rate limiting and DDoS protection

### Authentication & Key Management
- Local authentication key generation
- Public key sharing only during initial setup
- OS-specific secure storage for keys
- Public-private key pair authentication
- Local 2FA implementation

### Data Privacy
- Explicit opt-in data collection
- Complete data deletion capability
- Configurable message retention
- Automatic metadata and log purging
- Encrypted backups

## Architecture Overview

### Core Components
- **Express.js Server**: Handles RESTful API endpoints for user management and authentication
- **Socket.IO Server**: Manages real-time WebSocket connections for instant messaging
- **SQLite Database**: Provides lightweight, file-based data persistence
- **JWT Authentication**: Secures API endpoints and WebSocket connections
- **Argon2 Password Hashing**: Implements memory-hard password hashing for enhanced security
- **Winston Logger**: Provides structured logging with multiple transport options

### Security Architecture
- **End-to-End Encryption (E2EE)**: Messages are encrypted on the client side using libsodium
- **Zero-Knowledge Design**: Server never stores or processes plaintext messages
- **Secure Key Exchange**: Implements Diffie-Hellman key exchange for establishing shared secrets
- **Token-Based Authentication**: JWT tokens with short expiration times
- **SQL Injection Prevention**: Parameterized queries and input validation
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet Security Headers**: Implements various HTTP security headers

## Features

### Authentication & Authorization
- Secure user registration with password hashing
- JWT-based authentication with token expiration
- WebSocket connection authentication
- Session management and tracking
- Local 2FA implementation
- Public-private key pair authentication
- Token rotation on suspicious activity
- Minimum password requirements

### Real-time Communication
- WebSocket-based instant messaging over WSS
- Private message routing with PFS
- User presence tracking (online/offline status)
- Connection state management
- Rate limiting and DDoS protection
- Message integrity verification
- Unique nonces for each message
- MAC verification for all messages

### Data Management
- User profile storage (minimal metadata)
- Public key storage for E2EE
- Session tracking
- Last seen timestamps
- Configurable data retention
- Complete data deletion capability
- Automatic data purging
- Encrypted backups

### Security Features
- End-to-end encryption for messages
- Secure password hashing with Argon2
- JWT-based authentication
- HTTPS with HSTS
- SQL injection prevention
- Rate limiting
- Input validation
- Secure WebSocket connections
- Memory-hard password hashing
- Perfect Forward Secrecy
- Message integrity verification
- Intrusion detection
- Firewall rules
- DDoS protection
- Automatic security updates

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SQLite3

## Installation

1. Clone the repository
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file with the following variables:
   ```
   PORT=3001
   JWT_SECRET=your-secret-key-change-this-in-production
   CLIENT_URL=http://localhost:3000
   LOG_LEVEL=info
   ```

## Development

Run the server in development mode:
```bash
npm run dev
```

The development server includes:
- Hot reloading
- TypeScript compilation
- Error reporting
- Debug logging

## Production

1. Build the TypeScript files:
   ```bash
   npm run build
   ```
2. Start the server:
   ```bash
   npm start
   ```

For production deployment, consider:
- Using PM2 for process management
- Setting up Nginx as a reverse proxy
- Configuring SSL/TLS certificates
- Implementing rate limiting
- Setting up monitoring and alerting

## API Endpoints

### Authentication

#### Register User
- `POST /api/register`
- Creates a new user account
- Body:
  ```json
  {
    "username": "string",
    "password": "string",
    "publicKey": "string"
  }
  ```
- Response: 201 Created

#### Login
- `POST /api/login`
- Authenticates user and returns JWT token
- Body:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- Response: 200 OK with JWT token

### User Management

#### Get User's Public Key
- `GET /api/users/:userId/key`
- Retrieves public key for E2EE
- Requires authentication
- Response: 200 OK with public key

#### Get Online Users
- `GET /api/users/online`
- Lists currently online users
- Requires authentication
- Response: 200 OK with user list

## WebSocket Events

### Client to Server

#### Send Private Message
- Event: `private_message`
- Data:
  ```typescript
  {
    recipientId: number;
    message: string;     // Encrypted message using XSalsa20-Poly1305
    nonce: string;       // Unique nonce for each message
    mac: string;         // Message authentication code
    ephemeralKey: string; // Ephemeral public key for PFS
    timestamp: number;    // Message timestamp for replay prevention
  }
  ```

#### Update Presence
- Event: `presence_update`
- Data:
  ```typescript
  {
    status: 'online' | 'offline';
    timestamp: number;    // Timestamp for replay prevention
  }
  ```

### Server to Client

#### Receive Private Message
- Event: `private_message`
- Data:
  ```typescript
  {
    senderId: number;
    message: string;     // Encrypted message using XSalsa20-Poly1305
    nonce: string;       // Unique nonce for each message
    mac: string;         // Message authentication code
    ephemeralKey: string; // Ephemeral public key for PFS
    timestamp: number;    // Message timestamp for replay prevention
  }
  ```

#### User Presence Update
- Event: `user_presence`
- Data:
  ```typescript
  {
    userId: number;
    status: 'online' | 'offline';
    timestamp: number;    // Timestamp for replay prevention
  }
  ```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  public_key TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_retention_days INTEGER DEFAULT 30,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login DATETIME,
  account_locked_until DATETIME,
  key_rotation_date DATETIME,
  last_password_change DATETIME,
  security_settings JSON
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  is_valid BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Security Events Table
```sql
CREATE TABLE security_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  event_type TEXT NOT NULL,
  event_data JSON,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Security Considerations

### Password Security
- Passwords are hashed using Argon2id
- Memory-hard hashing algorithm
- Configurable memory cost and parallelism
- Salt automatically generated
- Minimum password requirements enforced
- Regular password rotation reminders
- Brute force protection with account locking
- Password strength validation

### Token Security
- JWT tokens expire after 24 hours
- Tokens are signed with a secret key
- Token payload includes minimal user information
- Tokens are validated on every request
- Token rotation on suspicious activity
- Session invalidation on security events
- Multiple device session management
- Secure token storage

### Data Protection
- No plaintext message storage
- Encrypted communication channels
- Secure key exchange with PFS
- Input validation and sanitization
- Automatic data purging
- Encrypted backups
- Data retention policies
- Complete data deletion capability
- Secure key rotation
- Metadata minimization

### Network Security
- CORS protection
- Security headers via Helmet
- WebSocket authentication
- Rate limiting
- DDoS protection
- Intrusion detection
- Firewall rules
- SSL/TLS configuration
- HSTS enforcement
- Certificate pinning
- IP whitelisting
- Connection encryption

### Monitoring and Auditing
- Security event logging
- Failed login tracking
- Session monitoring
- Activity auditing
- Intrusion detection
- Automated alerts
- Log rotation
- Secure log storage
- Audit trail maintenance

### Compliance and Privacy
- Data retention policies
- User consent management
- Privacy settings
- Data export capability
- GDPR compliance
- Data minimization
- User rights enforcement
- Privacy policy enforcement

## Monitoring and Logging

### Logging Levels
- ERROR: Critical errors and failures
- INFO: General operational information
- DEBUG: Detailed debugging information

### Log Storage
- Console output for development
- File-based logging for production
- Separate error log file
- Combined log file for all levels

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Express.js for the web framework
- Socket.IO for real-time communication
- SQLite for lightweight database
- Argon2 for secure password hashing
- JWT for authentication
- Winston for logging 
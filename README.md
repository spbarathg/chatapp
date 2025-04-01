# Secure Chat Application

A highly secure, end-to-end encrypted chat application built with TypeScript, Express, and WebSocket. This application implements multiple layers of security measures to ensure user privacy and data protection.

## Architecture Overview

### System Components
```
secure-chat/
├── client/                 # React frontend
├── server/                 # Express backend
│   ├── src/
│   │   ├── database/      # Database operations
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utilities
│   │   └── websocket/     # WebSocket handling
│   └── tests/             # Test files
└── shared/                # Shared types and utilities
```

### Data Flow
1. **Client-Server Communication**
   - HTTPS/SSL/TLS encryption for all HTTP requests
   - WebSocket for real-time messaging
   - JWT-based authentication
   - Rate limiting per IP

2. **Message Flow**
   ```
   Sender -> Encrypt -> Server -> Decrypt -> Recipient
   ```
   - Messages are encrypted client-side
   - Server only handles encrypted data
   - Zero-knowledge message storage

3. **Security Layers**
   - Network Security (HTTPS, WSS)
   - Application Security (Input validation, XSS protection)
   - Data Security (Encryption, Hashing)
   - Access Control (Authentication, Authorization)

## Security Features

### End-to-End Encryption
- Asymmetric encryption using RSA-4096 for key exchange
- Symmetric encryption using AES-256-GCM for message encryption
- Perfect forward secrecy with ephemeral key pairs
- Zero-knowledge message storage (only encrypted data is stored)

### Authentication & Authorization
- Secure password hashing using Argon2id
- JWT-based authentication with short-lived tokens
- Session management with secure session keys
- Two-factor authentication support
- Rate limiting and brute force protection

### Data Protection
- No plaintext data storage
- Encrypted metadata
- Automatic data cleanup
- Secure backup system
- Database encryption at rest

### Network Security
- HTTPS/SSL/TLS encryption
- WebSocket security with message validation
- CORS protection
- Security headers (HSTS, CSP, XSS protection)
- Rate limiting per IP

### Monitoring & Logging
- Comprehensive security event logging
- System health monitoring
- Real-time security alerts
- Audit logging
- Anonymized logging (no sensitive data)

## Database Schema

### Core Tables
1. **users**
   - Encrypted user data
   - Public/private key pairs
   - Security settings

2. **sessions**
   - Secure session management
   - Hashed IP and user agent
   - Automatic cleanup

3. **messages**
   - End-to-end encrypted content
   - Secure metadata
   - Retention policies

4. **security_events**
   - Audit logging
   - Security monitoring
   - Event tracking

### Supporting Tables
1. **message_retention**
   - Message lifecycle management
   - Retention policies
   - Automatic cleanup

2. **backup_history**
   - Secure backup tracking
   - Expiration management
   - Data recovery

3. **rate_limits**
   - Request tracking
   - Rate limiting
   - Abuse prevention

## Monitoring System

### Metrics Collection
- Memory usage
- CPU utilization
- Active connections
- Failed login attempts
- Failed requests
- Database size

### Alert System
- Real-time monitoring
- Threshold-based alerts
- Severity levels
- Alert resolution

### Data Retention
- Configurable retention periods
- Automatic cleanup
- Secure storage
- Audit trails

## Logging System

### Log Types
1. **Application Logs**
   - Error tracking
   - Performance monitoring
   - Debug information

2. **Security Logs**
   - Authentication events
   - Access attempts
   - Security violations

3. **Audit Logs**
   - User actions
   - System changes
   - Security events

### Log Management
- Daily rotation
- Size limits
- Compression
- Secure storage

## Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- SQLite3
- TypeScript
- npm or yarn

### Installation Steps
1. Clone the repository:
```bash
git clone https://github.com/yourusername/secure-chat.git
cd secure-chat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp server/.env.example server/.env
```
Edit the `.env` file with your configuration.

4. Build the application:
```bash
npm run build
```

### Configuration
Key environment variables:
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: Secret for JWT signing
- `SESSION_SECRET`: Secret for session encryption
- `DATABASE_PATH`: Path to SQLite database
- `BACKUP_PATH`: Path for database backups
- `LOG_LEVEL`: Logging verbosity
- `RATE_LIMIT_WINDOW`: Rate limiting window (ms)
- `RATE_LIMIT_MAX`: Maximum requests per window

## Usage

### Starting the Server
```bash
npm start
```

### Accessing the Application
- Web interface: http://localhost:3000
- API documentation: http://localhost:3001/api-docs

### Security Best Practices

1. **Password Management**
   - Use strong, unique passwords
   - Enable two-factor authentication
   - Regular password rotation

2. **Session Security**
   - Log out after use
   - Clear browser data regularly
   - Use secure browsers

3. **Data Protection**
   - Regular backups
   - Secure key storage
   - Message retention policies

4. **Network Security**
   - Use HTTPS only
   - Avoid public networks
   - Keep systems updated

## Development

### Running Tests
```bash
npm test
```

### Code Style
```bash
npm run lint
npm run format
```

### Development Guidelines
1. Follow TypeScript best practices
2. Maintain test coverage
3. Document all changes
4. Review security implications
5. Follow the code style guide

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security Reporting

If you discover a security vulnerability, please email security@yourdomain.com. Do not create public issues for security vulnerabilities.

## Acknowledgments

- Express.js team
- React team
- SQLite team
- All contributors and maintainers 
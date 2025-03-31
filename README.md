# Secure Chat Application

A dark-themed, minimalist chat application with end-to-end encryption and strong privacy features.

## Features

- **End-to-End Encryption**: All messages are encrypted using the Signal Protocol-inspired encryption scheme
- **Dark Theme**: Modern, eye-friendly interface
- **Minimalist Design**: Clean and intuitive user interface
- **Local Data Storage**: Messages and keys are stored securely on your device
- **Key Verification**: Built-in key verification system for secure communication
- **Privacy Settings**: Configurable message auto-deletion and key rotation reminders

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/secure-chat-app.git
cd secure-chat-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Usage

1. **First Launch**:
   - Create a new account by entering your username and password
   - The application will generate your encryption keys
   - Save your verification phrase securely

2. **Adding Contacts**:
   - Share your verification phrase with your contacts
   - Add contacts using their verification phrases
   - Verify the connection by comparing verification phrases

3. **Sending Messages**:
   - Select a contact from the sidebar
   - Type your message in the input field
   - Press Enter or click Send to send the message

4. **Security Features**:
   - Messages are automatically encrypted before sending
   - Keys are stored securely on your device
   - Configure auto-deletion and key rotation in Settings

## Security Considerations

- All messages are encrypted end-to-end
- Encryption keys are generated locally and never leave your device
- Messages are stored locally in an encrypted format
- No central server stores your messages
- Regular key rotation is recommended for maximum security

## Development

The application is built with:
- Electron for the desktop application
- React for the user interface
- TypeScript for type safety
- libsodium for encryption
- Styled-components for styling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Signal Protocol for the encryption inspiration
- Electron team for the desktop framework
- React team for the UI framework 
import { randomBytes, createHash, createHmac, createCipheriv, createDecipheriv } from 'crypto';
import { promisify } from 'util';
import { logger } from './logger';

const scrypt = promisify(require('crypto').scrypt);

// Constants for encryption
const ALGORITHM = 'xsalsa20-poly1305';
const KEY_LENGTH = 32;
const NONCE_LENGTH = 24;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;

// Key derivation parameters
const KEY_DERIVATION_PARAMS = {
  N: 65536, // Memory cost
  r: 8,     // Block size
  p: 1      // Parallelism
};

// Generate a new key pair for Curve25519
export async function generateKeyPair(): Promise<{ publicKey: Buffer; privateKey: Buffer }> {
  try {
    const { publicKey, privateKey } = await promisify(require('crypto').generateKeyPair)('x25519', {
      modulusLength: 255,
      publicKeyEncoding: {
        type: 'spki',
        format: 'der'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'der'
      }
    });

    return { publicKey, privateKey };
  } catch (error) {
    logger.error('Error generating key pair:', error);
    throw new Error('Failed to generate key pair');
  }
}

// Derive a symmetric key from a password using Argon2
export async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  try {
    return await scrypt(password, salt, KEY_LENGTH, KEY_DERIVATION_PARAMS);
  } catch (error) {
    logger.error('Error deriving key:', error);
    throw new Error('Failed to derive key');
  }
}

// Generate a new salt
export function generateSalt(): Buffer {
  return randomBytes(SALT_LENGTH);
}

// Encrypt data using XSalsa20-Poly1305
export function encrypt(data: Buffer, key: Buffer): { encrypted: Buffer; nonce: Buffer; authTag: Buffer } {
  try {
    const nonce = randomBytes(NONCE_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, nonce);
    
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return { encrypted, nonce, authTag };
  } catch (error) {
    logger.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt data using XSalsa20-Poly1305
export function decrypt(
  encrypted: Buffer,
  key: Buffer,
  nonce: Buffer,
  authTag: Buffer
): Buffer {
  try {
    const decipher = createDecipheriv(ALGORITHM, key, nonce);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
  } catch (error) {
    logger.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Generate a message authentication code (HMAC)
export function generateMAC(message: Buffer, key: Buffer): Buffer {
  try {
    return createHmac('sha512', key)
      .update(message)
      .digest();
  } catch (error) {
    logger.error('Error generating MAC:', error);
    throw new Error('Failed to generate MAC');
  }
}

// Verify a message authentication code
export function verifyMAC(message: Buffer, key: Buffer, mac: Buffer): boolean {
  try {
    const calculatedMAC = generateMAC(message, key);
    return calculatedMAC.equals(mac);
  } catch (error) {
    logger.error('Error verifying MAC:', error);
    throw new Error('Failed to verify MAC');
  }
}

// Generate a secure random nonce
export function generateNonce(): Buffer {
  return randomBytes(NONCE_LENGTH);
}

// Hash data using SHA-512
export function hash(data: Buffer): Buffer {
  return createHash('sha512')
    .update(data)
    .digest();
}

// Generate a secure session key
export function generateSessionKey(): Buffer {
  return randomBytes(KEY_LENGTH);
}

// Perform key exchange using Curve25519
export async function performKeyExchange(
  privateKey: Buffer,
  peerPublicKey: Buffer
): Promise<Buffer> {
  try {
    const sharedSecret = await promisify(require('crypto').diffieHellman)({
      privateKey,
      publicKey: peerPublicKey
    });

    return hash(sharedSecret);
  } catch (error) {
    logger.error('Error performing key exchange:', error);
    throw new Error('Failed to perform key exchange');
  }
}

// Sign data using Ed25519
export async function sign(data: Buffer, privateKey: Buffer): Promise<Buffer> {
  try {
    const signature = await promisify(require('crypto').sign)(
      'sha512',
      data,
      privateKey
    );
    return signature;
  } catch (error) {
    logger.error('Error signing data:', error);
    throw new Error('Failed to sign data');
  }
}

// Verify signature using Ed25519
export async function verifySignature(
  data: Buffer,
  signature: Buffer,
  publicKey: Buffer
): Promise<boolean> {
  try {
    return await promisify(require('crypto').verify)(
      'sha512',
      data,
      publicKey,
      signature
    );
  } catch (error) {
    logger.error('Error verifying signature:', error);
    throw new Error('Failed to verify signature');
  }
}

// Secure message format
export interface SecureMessage {
  encrypted: Buffer;
  nonce: Buffer;
  authTag: Buffer;
  signature: Buffer;
  timestamp: number;
}

// Create a secure message
export async function createSecureMessage(
  data: Buffer,
  key: Buffer,
  privateKey: Buffer
): Promise<SecureMessage> {
  const { encrypted, nonce, authTag } = encrypt(data, key);
  const signature = await sign(encrypted, privateKey);

  return {
    encrypted,
    nonce,
    authTag,
    signature,
    timestamp: Date.now()
  };
}

// Verify and decrypt a secure message
export async function verifyAndDecryptMessage(
  message: SecureMessage,
  key: Buffer,
  publicKey: Buffer
): Promise<Buffer> {
  // Verify signature
  const isValid = await verifySignature(message.encrypted, message.signature, publicKey);
  if (!isValid) {
    throw new Error('Invalid message signature');
  }

  // Verify timestamp (prevent replay attacks)
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  if (now - message.timestamp > maxAge) {
    throw new Error('Message too old');
  }

  // Decrypt message
  return decrypt(message.encrypted, key, message.nonce, message.authTag);
} 
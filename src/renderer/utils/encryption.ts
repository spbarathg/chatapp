import sodium from 'libsodium-wrappers';

export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  await sodium.ready;
  const keyPair = sodium.crypto_box_keypair();
  return {
    publicKey: sodium.to_base64(keyPair.publicKey),
    privateKey: sodium.to_base64(keyPair.privateKey),
  };
}

export async function encryptMessage(message: string, recipientPublicKey: string): Promise<string> {
  await sodium.ready;
  const messageBytes = sodium.from_string(message);
  const publicKeyBytes = sodium.from_base64(recipientPublicKey);
  const ephemeralKeyPair = sodium.crypto_box_keypair();
  
  const encryptedMessage = sodium.crypto_box_easy(
    messageBytes,
    sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES),
    publicKeyBytes,
    ephemeralKeyPair.privateKey
  );

  return sodium.to_base64(encryptedMessage);
}

export async function decryptMessage(
  encryptedMessage: string,
  senderPublicKey: string,
  recipientPrivateKey: string
): Promise<string> {
  await sodium.ready;
  const encryptedBytes = sodium.from_base64(encryptedMessage);
  const publicKeyBytes = sodium.from_base64(senderPublicKey);
  const privateKeyBytes = sodium.from_base64(recipientPrivateKey);

  const decryptedMessage = sodium.crypto_box_open_easy(
    encryptedBytes,
    sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES),
    publicKeyBytes,
    privateKeyBytes
  );

  return sodium.to_string(decryptedMessage);
}

export function generateVerificationPhrase(): string {
  const words = [
    'apple', 'banana', 'cherry', 'date', 'elderberry',
    'fig', 'grape', 'honeydew', 'kiwi', 'lemon',
    'mango', 'nectarine', 'orange', 'papaya', 'quince',
    'raspberry', 'strawberry', 'tangerine', 'ugli', 'watermelon'
  ];
  
  const phrase = [];
  for (let i = 0; i < 4; i++) {
    phrase.push(words[Math.floor(Math.random() * words.length)]);
  }
  
  return phrase.join('-');
} 
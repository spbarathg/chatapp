declare module 'libsodium-wrappers' {
  interface Sodium {
    ready: Promise<void>;
    crypto_box_keypair(): {
      publicKey: Uint8Array;
      privateKey: Uint8Array;
    };
    crypto_box_easy(
      message: Uint8Array,
      nonce: Uint8Array,
      recipientPublicKey: Uint8Array,
      senderPrivateKey: Uint8Array
    ): Uint8Array;
    crypto_box_open_easy(
      encryptedMessage: Uint8Array,
      nonce: Uint8Array,
      senderPublicKey: Uint8Array,
      recipientPrivateKey: Uint8Array
    ): Uint8Array;
    crypto_generichash(length: number, message: Uint8Array): Uint8Array;
    randombytes_buf(length: number): Uint8Array;
    from_string(str: string): Uint8Array;
    to_string(bytes: Uint8Array): string;
    crypto_box_NONCEBYTES: number;
  }

  const sodium: Sodium;
  export default sodium;
} 
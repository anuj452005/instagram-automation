import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes IV is standard for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes auth tag is standard for GCM

/**
 * Retrieves the 32-byte encryption key buffer from environment.
 * If the key is a 64-character hex string, parses it.
 * Otherwise, pads/truncates to 32 bytes (only used in development).
 */
function getKeyBuffer(): Buffer {
  const key = env.ENCRYPTION_KEY;

  // If it's a valid 64-character hex string, parse it
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex');
  }

  // Fallback for non-hex keys (mainly dev environment/defaults)
  const buf = Buffer.alloc(32);
  buf.write(key, 'utf-8');
  return buf;
}

/**
 * Encrypts a string using AES-256-GCM.
 * Returns a colon-separated string: "iv:ciphertext:auth_tag"
 */
export function encrypt(text: string): string {
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypts a colon-separated "iv:ciphertext:auth_tag" string.
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format. Expected iv:ciphertext:auth_tag');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const ciphertext = Buffer.from(parts[1], 'hex');
  const authTag = Buffer.from(parts[2], 'hex');

  const key = getKeyBuffer();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

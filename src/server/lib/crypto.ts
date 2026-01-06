import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Get encryption key as buffer (must be 32 bytes for AES-256)
function getEncryptionKey(): Buffer {
  const key = env.ENCRYPTION_KEY;
  // Ensure key is exactly 32 bytes
  if (key.length === 32) {
    return Buffer.from(key, 'utf-8');
  }
  // If not 32 bytes, hash it to get consistent 32 bytes
  return crypto.createHash('sha256').update(key).digest();
}

// Return base64-encoded strings for storage in text columns
export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

export function encrypt(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf-8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  // Return as base64-encoded strings for text column storage
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

export function decrypt(encrypted: string, iv: string, authTag: string): string {
  const key = getEncryptionKey();

  // Decode from base64
  const encryptedBuffer = Buffer.from(encrypted, 'base64');
  const ivBuffer = Buffer.from(iv, 'base64');
  const authTagBuffer = Buffer.from(authTag, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf-8');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

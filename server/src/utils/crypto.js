import crypto from 'crypto';
import { ENV } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encrypt sensitive plain text using AES-256-GCM.
 * Output format: iv:tag:ciphertext (hex-encoded)
 */
export const encrypt = (text) => {
  if (!text) return text;
  
  const key = Buffer.from(ENV.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32), 'utf8');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(typeof text === 'object' ? JSON.stringify(text) : String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt AES-256-GCM cipher string.
 */
export const decrypt = (encryptedString) => {
  if (!encryptedString || typeof encryptedString !== 'string') return encryptedString;
  
  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
      // If not in encrypted format (e.g. legacy/mock data), return as is
      return encryptedString;
    }
    
    const [ivHex, tagHex, cipherHex] = parts;
    const key = Buffer.from(ENV.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32), 'utf8');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return null;
  }
};

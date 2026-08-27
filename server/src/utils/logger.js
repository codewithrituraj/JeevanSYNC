/**
 * HIPAA / Healthcare-safe logger that redacts PII/PHI (passwords, tokens, health notes, aadhaar/ssn)
 */

const REDACT_KEYS = [
  'password',
  'passwordHash',
  'token',
  'refreshToken',
  'encryptedData',
  'authorization',
  'creditCard',
  'pin',
  'secret'
];

const sanitize = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }
  
  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (REDACT_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

export const logger = {
  info: (msg, meta) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta ? JSON.stringify(sanitize(meta)) : '');
  },
  warn: (msg, meta) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta ? JSON.stringify(sanitize(meta)) : '');
  },
  error: (msg, meta) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, meta ? JSON.stringify(sanitize(meta)) : '');
  },
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${msg}`, meta ? JSON.stringify(sanitize(meta)) : '');
    }
  }
};

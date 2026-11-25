import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5050', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/jeevansync?schema=public',
  
  // Auth & Security
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_min_32_characters_long_12345',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_min_32_characters_long_12345',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_DAYS: parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10),
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '01234567890123456789012345678901', // 32 bytes for AES-256
  
  // WhatsApp Cloud API
  WHATSAPP_API_URL: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v20.0',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || 'mock_phone_number_id',
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || 'mock_whatsapp_token',
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'jeevansync_whatsapp_verify_token_2026',
  WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET || 'mock_meta_app_secret',
  
  // AI Service (MonikaCare)
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini', // 'gemini' | 'groq' | 'mock'
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  
  // Rate Limits
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

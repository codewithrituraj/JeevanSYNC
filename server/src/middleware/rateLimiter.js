import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many requests from this IP. Please try again after 15 minutes.', 429, null, 'RATE_LIMIT_EXCEEDED');
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login/register attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many authentication attempts. Please try again after 15 minutes.', 429, null, 'AUTH_RATE_LIMIT');
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 triage queries per min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'MonikaCare rate limit reached. Please wait a moment before sending another message.', 429, null, 'AI_RATE_LIMIT');
  },
});

export const whatsappWebhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'WhatsApp webhook rate limit exceeded.', 429, null, 'WEBHOOK_RATE_LIMIT');
  },
});

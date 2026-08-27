import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { sendSuccess } from './utils/response.js';

// Route Imports
import authRoutes from './modules/auth/auth.routes.js';
import patientHistoryRoutes from './modules/patient-history/patient-history.routes.js';
import reminderRoutes from './modules/reminders/reminders.routes.js';
import receptionRoutes from './modules/reception/reception.routes.js';
import bloodbankRoutes from './modules/bloodbank/bloodbank.routes.js';
import diagnosticsRoutes from './modules/diagnostics/diagnostics.routes.js';
import coordinationRoutes from './modules/coordination/coordination.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import referralRoutes from './modules/referral/referral.routes.js';
import insuranceRoutes from './modules/insurance/insurance.routes.js';
import monikaAiRoutes from './modules/monika-ai/monika-ai.routes.js';
import whatsappRoutes from './modules/whatsapp/whatsapp.routes.js';

const app = express();

// Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration - explicit allow-list
const allowedOrigins = [
  ENV.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, internal server, WhatsApp webhook)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked request from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Hub-Signature-256'],
}));

// Rate Limiting
app.use(globalLimiter);

// Middlewares
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    // Store raw body for WhatsApp webhook HMAC verification
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Healthcheck Route
app.get('/health', (req, res) => {
  return sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    service: 'JeevanSYNC Backend API',
  });
});

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patient-history', patientHistoryRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/reception', receptionRoutes);
app.use('/api/v1/bloodbank', bloodbankRoutes);
app.use('/api/v1/diagnostics', diagnosticsRoutes);
app.use('/api/v1/coordination', coordinationRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/referrals', referralRoutes);
app.use('/api/v1/insurance', insuranceRoutes);
app.use('/api/v1/monika-ai', monikaAiRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND',
    },
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;

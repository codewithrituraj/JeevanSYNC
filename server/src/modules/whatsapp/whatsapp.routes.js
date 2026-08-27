import { Router } from 'express';
import * as whatsappController from './whatsapp.controller.js';
import { whatsappWebhookLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Meta Cloud API Webhook endpoints
router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappWebhookLimiter, whatsappController.handleWebhook);

// Dev / Testing Simulation Endpoint
router.post('/simulate', whatsappController.simulateMessage);

export default router;

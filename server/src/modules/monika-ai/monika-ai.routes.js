import { Router } from 'express';
import * as monikaController from './monika-ai.controller.js';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { aiLimiter } from '../../middleware/rateLimiter.js';
import { chatSchema } from './monika-ai.validation.js';

const router = Router();

router.post('/chat', aiLimiter, optionalAuth, validate(chatSchema), monikaController.chat);
router.get('/history/:sessionId', monikaController.getHistory);

export default router;

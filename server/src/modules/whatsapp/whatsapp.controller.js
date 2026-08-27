import * as whatsappService from './whatsapp.service.js';
import { ENV } from '../../config/env.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';

/**
 * Meta Webhook Verification (GET)
 */
export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === ENV.WHATSAPP_VERIFY_TOKEN) {
    logger.info('WhatsApp webhook verified successfully by Meta');
    return res.status(200).send(challenge);
  }

  logger.warn('WhatsApp webhook verification rejected: Invalid verify token');
  return res.status(403).send('Forbidden');
};

/**
 * Meta Webhook Inbound Message Receiver (POST)
 */
export const handleWebhook = async (req, res) => {
  // Always return 200 fast to Meta to prevent retry loops
  res.status(200).send('EVENT_RECEIVED');

  try {
    const signature = req.headers['x-hub-signature-256'];
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

    const isValid = whatsappService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.error('WhatsApp Webhook rejected: Signature verification mismatch');
      return;
    }

    const body = req.body;
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value;
          if (value?.messages) {
            for (const message of value.messages) {
              await whatsappService.handleIncomingMessage(message);
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error processing WhatsApp webhook event:', { error: error.message });
  }
};

/**
 * Simulator endpoint for local dev testing without live Meta Webhook tunnel
 */
export const simulateMessage = async (req, res) => {
  try {
    const { from = '9876543210', text, buttonId, location } = req.body;

    const messageData = {
      from,
      type: location ? 'location' : buttonId ? 'interactive' : 'text',
      ...(text ? { text: { body: text } } : {}),
      ...(buttonId
        ? {
            interactive: {
              type: 'button_reply',
              button_reply: { id: buttonId },
            },
          }
        : {}),
      ...(location ? { location } : {}),
    };

    const result = await whatsappService.handleIncomingMessage(messageData);
    return sendSuccess(res, { simulatedResult: result }, 200, 'WhatsApp message simulated successfully');
  } catch (error) {
    logger.error('Error in simulateMessage:', { error: error.message, stack: error.stack });
    return sendError(res, error.message, 500);
  }
};

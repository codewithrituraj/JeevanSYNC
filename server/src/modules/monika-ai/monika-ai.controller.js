import * as monikaService from './monika-ai.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const chat = async (req, res) => {
  try {
    const { sessionId, prompt } = req.validated.body;
    const userId = req.user?.id || null;

    const result = await monikaService.handleUserChat({
      userId,
      sessionId,
      prompt,
    });

    if (result.triageResult.urgency === 'EMERGENCY') {
      await logAudit({
        userId,
        action: 'MONIKA_EMERGENCY_TRIAGE_TRIGGERED',
        resource: 'monika_ai',
        resourceId: sessionId,
        req,
        details: { urgency: 'EMERGENCY', severity: result.triageResult.severityScore },
      });
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await monikaService.getConversationHistory(sessionId);
    return sendSuccess(res, history);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

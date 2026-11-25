import prisma from '../../config/prisma.js';
import { getAiProvider } from './aiProvider.js';
import { logger } from '../../utils/logger.js';

const toDbJson = (data) => {
  if (data === null || data === undefined) return null;
  return typeof data === 'string' ? data : JSON.stringify(data);
};

const parseDbJson = (data) => {
  if (!data) return [];
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const MONIKA_SYSTEM_PROMPT = `
You are "MonikaCare AI", a dedicated, compassionate, and highly disciplined doctor's-assistant-style clinical triage helper in the JeevanSYNC healthcare system.

CORE CLINICAL BEHAVIOR & GUARDRAILS:
1. You are a TRIAGE-ORIENTED ASSISTANT, NEVER a diagnostic replacement.
2. NEVER claim to diagnose illnesses or provide definitive clinical conclusions. Frame all responses as general medical explanations pending confirmation by a licensed physician.
3. STRICTLY REFUSE to give specific drug dosages or adjust prescription regimens; always direct the user to a licensed doctor or pharmacist.
4. If the user presents red-flag emergency symptoms (such as crushing chest pain, sudden numbness/paralysis, severe breathing difficulty, massive bleeding, anaphylaxis, unconsciousness, poisoning, or acute suicidal ideation), your urgency MUST be "EMERGENCY" and the very first sentence MUST instruct them to immediately seek emergency care / call an ambulance.
5. You must ALWAYS return your output strictly in valid JSON format matching this exact JSON schema:

{
  "urgency": "EMERGENCY" | "SEEK_PROMPT_CARE" | "SEE_DOCTOR_SOON" | "ROUTINE",
  "severityScore": number (1 to 100),
  "explanation": "A short, empathetic, plain-language explanation of what the symptoms commonly relate to (never a definitive diagnosis).",
  "precautions": ["Practical precaution 1", "Practical precaution 2", ...],
  "whatToAvoid": ["Thing to avoid 1", "Thing to avoid 2", ...],
  "recommendedAction": "Clear advice on next steps (e.g. Call emergency services now / Visit urgent care within 6h / Book specialist consultation / General self-care).",
  "disclaimer": "MonikaCare AI is an automated clinical triage assistant and does not replace professional medical advice. Always consult a licensed healthcare provider."
}
`;

export const generateMonikaTriage = async ({ userPrompt, conversationHistory = [] }) => {
  const provider = getAiProvider();

  const messages = [
    ...conversationHistory.map((m) => ({
      role: m.role,
      content: typeof m.content === 'object' ? JSON.stringify(m.content) : m.content,
    })),
    { role: 'user', content: userPrompt },
  ];

  try {
    const rawResponse = await provider.generateResponse({
      systemPrompt: MONIKA_SYSTEM_PROMPT,
      messages,
      temperature: 0.2,
    });

    // Clean markdown code fence if present
    const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      urgency: parsed.urgency || 'SEE_DOCTOR_SOON',
      severityScore: parsed.severityScore || 50,
      explanation: parsed.explanation || 'Please consult a doctor for a thorough evaluation.',
      precautions: Array.isArray(parsed.precautions) ? parsed.precautions : [],
      whatToAvoid: Array.isArray(parsed.whatToAvoid) ? parsed.whatToAvoid : [],
      recommendedAction: parsed.recommendedAction || 'Schedule a visit with a healthcare professional.',
      disclaimer: parsed.disclaimer || 'MonikaCare AI is a triage assistant and not a diagnostic replacement.',
    };
  } catch (error) {
    logger.error('Error generating AI triage response, invoking safety fallback:', { error: error.message });

    // Safety fallback
    const isEmergency = ['chest', 'heart', 'breath', 'bleed', 'stroke', 'faint'].some(k =>
      userPrompt.toLowerCase().includes(k)
    );

    return {
      urgency: isEmergency ? 'EMERGENCY' : 'SEE_DOCTOR_SOON',
      severityScore: isEmergency ? 90 : 40,
      explanation: 'Your described health symptoms require attention. Please consult a qualified doctor for a professional assessment.',
      precautions: [
        'Rest in a comfortable position and avoid physical exertion.',
        'Keep emergency helpline numbers accessible (112 / 108).',
      ],
      whatToAvoid: [
        'Avoid self-medication without professional medical advice.',
        'Do not ignore escalating symptoms.',
      ],
      recommendedAction: isEmergency
        ? 'Seek emergency medical attention or request an ambulance immediately.'
        : 'Consult a general physician or relevant specialist at your earliest convenience.',
      disclaimer: 'MonikaCare AI is an automated triage assistant and does not replace professional medical advice.',
    };
  }
};

export const handleUserChat = async ({ userId, sessionId, prompt }) => {
  // Load conversation session from DB
  let conversation = await prisma.monikaConversation.findUnique({
    where: { sessionId },
  });

  const existingMessages = conversation ? parseDbJson(conversation.messagesJson) : [];

  // Generate triage response
  const triageResult = await generateMonikaTriage({
    userPrompt: prompt,
    conversationHistory: existingMessages.slice(-6), // context window of last 6 messages
  });

  const updatedMessages = [
    ...existingMessages,
    { role: 'user', content: prompt, timestamp: new Date().toISOString() },
    { role: 'assistant', content: triageResult, timestamp: new Date().toISOString() },
  ];

  if (!conversation) {
    conversation = await prisma.monikaConversation.create({
      data: {
        userId: userId || null,
        sessionId,
        messagesJson: toDbJson(updatedMessages),
        lastTriageTier: triageResult.urgency,
      },
    });
  } else {
    conversation = await prisma.monikaConversation.update({
      where: { sessionId },
      data: {
        userId: userId || conversation.userId,
        messagesJson: toDbJson(updatedMessages),
        lastTriageTier: triageResult.urgency,
        updatedAt: new Date(),
      },
    });
  }

  return {
    sessionId,
    triageResult,
    conversationId: conversation.id,
  };
};

export const getConversationHistory = async (sessionId) => {
  const conversation = await prisma.monikaConversation.findUnique({
    where: { sessionId },
  });

  if (!conversation) {
    return { sessionId, messages: [] };
  }

  return {
    sessionId,
    lastTriageTier: conversation.lastTriageTier,
    messages: parseDbJson(conversation.messagesJson),
  };
};

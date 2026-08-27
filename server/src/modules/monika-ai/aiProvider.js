import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

/**
 * Provider Interface for AI LLM calls.
 * Allows effortless swapping between Google Gemini, Groq, Anthropic, or Mock without modifying business logic.
 */

class GeminiProvider {
  constructor(apiKey, modelName = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateResponse({ systemPrompt, messages, temperature = 0.2 }) {
    if (!this.apiKey || !this.client) {
      throw new Error('Gemini API key is not configured');
    }

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature,
        responseMimeType: 'application/json',
      },
    });

    // Format conversation history for Gemini SDK
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const result = await model.generateContent({ contents });
    const responseText = result.response.text();
    return responseText;
  }
}

class MockAIProvider {
  async generateResponse({ messages }) {
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

    // Emergency Red Flags rule detection
    const isEmergency = [
      'chest pain', 'heart attack', 'shortness of breath', 'can\'t breathe',
      'stroke', 'unconscious', 'fainted', 'heavy bleeding', 'severe burns',
      'paralysis', 'suicide', 'poison'
    ].some(term => lastUserMessage.includes(term));

    if (isEmergency) {
      return JSON.stringify({
        urgency: 'EMERGENCY',
        severityScore: 95,
        explanation: 'The symptoms you described (such as severe chest pain, breathing difficulty, or neurological signs) can indicate a critical medical emergency requiring immediate medical intervention.',
        precautions: [
          'Call national emergency services (112 / 108) or tap "Request Ambulance" right now.',
          'Sit upright or in a comfortable resting position; do not exert yourself.',
          'Keep your airway clear and loosen tight clothing around the neck and chest.'
        ],
        whatToAvoid: [
          'Do NOT attempt to drive yourself to the hospital.',
          'Do NOT delay seeking emergency medical attention.',
          'Do NOT consume heavy food, caffeine, or unprescribed medications.'
        ],
        recommendedAction: 'Emergency — Call ambulance or visit the nearest emergency room immediately.',
        disclaimer: 'MonikaCare AI is an automated triage assistant and NOT a medical diagnostic tool. Please seek immediate professional medical care.'
      });
    }

    // Standard medical triage response
    return JSON.stringify({
      urgency: 'SEE_DOCTOR_SOON',
      severityScore: 45,
      explanation: 'Your described symptoms could relate to common physiological or mild infectious processes. While usually manageable, clinical examination is advised if symptoms persist.',
      precautions: [
        'Stay well hydrated with clean water and oral electrolytes if feeling fatigued.',
        'Get adequate rest in a well-ventilated room.',
        'Monitor temperature and symptom progression twice daily.'
      ],
      whatToAvoid: [
        'Avoid self-medicating with antibiotics or unverified painkillers without a prescription.',
        'Avoid strenuous physical exertion until recovery.',
        'Avoid cold or irritating foods if experiencing throat/chest discomfort.'
      ],
      recommendedAction: 'Schedule an appointment with a general physician or relevant specialist within 24-48 hours.',
      disclaimer: 'MonikaCare AI provides preliminary health information and triage guidance only. Consult a licensed physician for diagnosis and prescription.'
    });
  }
}

let activeProvider = null;

export const getAiProvider = () => {
  if (activeProvider) return activeProvider;

  if (ENV.AI_PROVIDER === 'gemini' && ENV.GEMINI_API_KEY) {
    logger.info(`Using Google Gemini AI Provider (${ENV.GEMINI_MODEL})`);
    activeProvider = new GeminiProvider(ENV.GEMINI_API_KEY, ENV.GEMINI_MODEL);
  } else {
    logger.info('Using Intelligent Clinical Triage Engine (Mock/Fallback Provider)');
    activeProvider = new MockAIProvider();
  }

  return activeProvider;
};

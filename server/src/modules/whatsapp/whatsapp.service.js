import crypto from 'crypto';
import prisma from '../../config/prisma.js';
import { ENV } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import * as receptionService from '../reception/reception.service.js';
import * as monikaService from '../monika-ai/monika-ai.service.js';

const toDbJson = (data) => {
  if (data === null || data === undefined) return null;
  return typeof data === 'string' ? data : JSON.stringify(data);
};

const parseDbJson = (data) => {
  if (!data) return {};
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
};

/**
 * Verify Meta's SHA-256 signature on incoming webhook calls.
 */
export const verifyWebhookSignature = (rawBody, signatureHeader) => {
  if (!signatureHeader || !ENV.WHATSAPP_APP_SECRET || ENV.WHATSAPP_APP_SECRET === 'mock_meta_app_secret') {
    // In dev / mock mode, allow if mock secret
    return true;
  }

  const [algo, signature] = signatureHeader.split('=');
  if (algo !== 'sha256' || !signature) {
    return false;
  }

  const expectedHash = crypto
    .createHmac('sha256', ENV.WHATSAPP_APP_SECRET)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedHash, 'hex'));
};

/**
 * Send WhatsApp message using Meta Graph API (or mock logger if in dev).
 */
export const sendWhatsAppMessage = async (toPhone, messagePayload) => {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toPhone,
    ...messagePayload,
  };

  if (ENV.WHATSAPP_ACCESS_TOKEN === 'mock_whatsapp_token' || !ENV.WHATSAPP_ACCESS_TOKEN) {
    logger.info(`[MOCK WHATSAPP OUTBOUND] To: ${toPhone}`, payload);
    return { success: true, mock: true };
  }

  try {
    const url = `${ENV.WHATSAPP_API_URL}/${ENV.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('WhatsApp API send failure:', { error: error.message, to: toPhone });
    return { success: false, error: error.message };
  }
};

/**
 * Send simple text message
 */
export const sendTextMessage = async (toPhone, text) => {
  return await sendWhatsAppMessage(toPhone, {
    type: 'text',
    text: { body: text },
  });
};

/**
 * Send interactive quick buttons
 */
export const sendButtonMessage = async (toPhone, text, buttons) => {
  return await sendWhatsAppMessage(toPhone, {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text },
      action: {
        buttons: buttons.map((b, idx) => ({
          type: 'reply',
          reply: { id: b.id || `btn_${idx}`, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
};

/**
 * Get or create WhatsApp session state
 */
export const getSession = async (phoneNumber) => {
  let session = await prisma.whatsAppSession.findUnique({
    where: { phoneNumber },
  });

  if (!session) {
    session = await prisma.whatsAppSession.create({
      data: {
        phoneNumber,
        currentState: 'IDLE',
        contextDataJson: toDbJson({}),
      },
    });
  }

  return {
    ...session,
    context: parseDbJson(session.contextDataJson),
  };
};

/**
 * Update WhatsApp session state
 */
export const updateSession = async (phoneNumber, state, context) => {
  return await prisma.whatsAppSession.update({
    where: { phoneNumber },
    data: {
      currentState: state,
      contextDataJson: toDbJson(context),
      lastActive: new Date(),
    },
  });
};

/**
 * Main WhatsApp conversation state machine handler
 */
export const handleIncomingMessage = async (messageData) => {
  const fromPhone = messageData.from;
  const messageType = messageData.type;
  const session = await getSession(fromPhone);
  const context = session.context || {};

  let textContent = '';
  let buttonId = '';

  if (messageType === 'text') {
    textContent = messageData.text?.body?.trim() || '';
  } else if (messageType === 'interactive') {
    buttonId = messageData.interactive?.button_reply?.id || messageData.interactive?.list_reply?.id || '';
  } else if (messageType === 'location') {
    // User shared GPS coordinates
    const { latitude, longitude } = messageData.location;
    return await handleLocationMessage(fromPhone, latitude, longitude);
  }

  const lowerText = textContent.toLowerCase();

  // Reset or Greetings
  if (['hi', 'hello', 'start', 'menu', 'reset', 'help'].includes(lowerText)) {
    await updateSession(fromPhone, 'IDLE', {});
    return await sendWelcomeMenu(fromPhone);
  }

  // State: IDLE / Menu selections
  if (session.currentState === 'IDLE') {
    if (buttonId === 'BTN_BOOK' || lowerText.includes('book')) {
      await updateSession(fromPhone, 'SELECTING_SPECIALTY', context);
      return await sendSpecialtyMenu(fromPhone);
    } else if (buttonId === 'BTN_NEARBY' || lowerText.includes('nearby') || lowerText.includes('hospital')) {
      await updateSession(fromPhone, 'WAITING_FOR_LOCATION', context);
      return await sendTextMessage(
        fromPhone,
        '📍 Please share your current location using WhatsApp Location Share (tap 📎 -> Location), and we will find the closest hospitals and emergency centers.'
      );
    } else if (buttonId === 'BTN_MONIKA' || lowerText.includes('monika') || lowerText.includes('ai')) {
      await updateSession(fromPhone, 'MONIKA_MODE', context);
      return await sendTextMessage(
        fromPhone,
        '👩‍⚕️ MonikaCare AI Triage Assistant activated.\n\nPlease describe your symptoms or health query. (Type "menu" anytime to return).'
      );
    } else if (buttonId === 'BTN_BED_BLOOD' || lowerText.includes('bed') || lowerText.includes('blood')) {
      return await sendBedBloodSummary(fromPhone);
    } else {
      return await sendWelcomeMenu(fromPhone);
    }
  }

  // State: SELECTING_SPECIALTY
  if (session.currentState === 'SELECTING_SPECIALTY') {
    const specialty = buttonId.replace('SPEC_', '') || textContent;
    const doctors = await receptionService.searchDoctors({ specialty });

    if (doctors.length === 0) {
      await sendTextMessage(fromPhone, `No active doctors found for "${specialty}". Showing all available specialties:`);
      return await sendSpecialtyMenu(fromPhone);
    }

    context.selectedSpecialty = specialty;
    context.availableDoctors = doctors.slice(0, 3);
    await updateSession(fromPhone, 'SELECTING_DOCTOR', context);

    let docMsg = `🏥 Available ${specialty} Doctors:\n\n`;
    const buttons = [];

    context.availableDoctors.forEach((doc, idx) => {
      docMsg += `${idx + 1}. *${doc.user.name}* (${doc.hospital.name})\n   Exp: ${doc.experienceYears} yrs | Fee: ₹${doc.consultationFee}\n\n`;
      buttons.push({ id: `DOC_${doc.id}`, title: doc.user.name.slice(0, 20) });
    });

    docMsg += 'Select a doctor below to view appointment slots:';
    return await sendButtonMessage(fromPhone, docMsg, buttons);
  }

  // State: SELECTING_DOCTOR
  if (session.currentState === 'SELECTING_DOCTOR') {
    const docId = buttonId.replace('DOC_', '');
    const doctor = await prisma.doctor.findUnique({
      where: { id: docId },
      include: { user: true, hospital: true },
    });

    if (!doctor) {
      await updateSession(fromPhone, 'IDLE', {});
      return await sendTextMessage(fromPhone, 'Doctor selection invalid. Returning to menu.');
    }

    context.selectedDoctorId = doctor.id;
    context.selectedDoctorName = doctor.user.name;
    context.selectedHospitalId = doctor.hospitalId;
    context.selectedHospitalName = doctor.hospital.name;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const slots = await receptionService.getDoctorAvailableSlots(doctor.id, dateStr);
    const availableSlots = slots.filter((s) => s.available).slice(0, 3);

    if (availableSlots.length === 0) {
      await sendTextMessage(fromPhone, `No open slots for tomorrow with ${doctor.user.name}.`);
      return await sendWelcomeMenu(fromPhone);
    }

    context.bookingDate = dateStr;
    await updateSession(fromPhone, 'SELECTING_SLOT', context);

    const slotButtons = availableSlots.map((s) => ({
      id: `SLOT_${dateStr}T${s.time}:00`,
      title: `${s.time} (Tomorrow)`,
    }));

    return await sendButtonMessage(
      fromPhone,
      `📅 Available Slots with *${doctor.user.name}* for tomorrow (${dateStr}):\n\nChoose a slot:`,
      slotButtons
    );
  }

  // State: SELECTING_SLOT
  if (session.currentState === 'SELECTING_SLOT') {
    const slotIso = buttonId.replace('SLOT_', '');
    context.selectedSlotIso = slotIso;

    // Find or create patient user based on phone
    let patient = await prisma.user.findUnique({
      where: { phone: fromPhone },
    });

    if (!patient) {
      patient = await prisma.user.create({
        data: {
          phone: fromPhone,
          name: `WhatsApp User (${fromPhone.slice(-4)})`,
          passwordHash: 'WHATSAPP_AUTO_REGISTERED',
          role: 'PATIENT',
        },
      });
    }

    const appointment = await receptionService.bookAppointment({
      patientId: patient.id,
      doctorId: context.selectedDoctorId,
      hospitalId: context.selectedHospitalId,
      slotTime: new Date(slotIso).toISOString(),
      notes: 'Booked via JeevanSYNC WhatsApp Bot',
      source: 'WHATSAPP',
    });

    await updateSession(fromPhone, 'IDLE', {});

    return await sendTextMessage(
      fromPhone,
      `✅ *Appointment Confirmed!*\n\n` +
      `👤 Doctor: ${context.selectedDoctorName}\n` +
      `🏥 Hospital: ${context.selectedHospitalName}\n` +
      `🕒 Time: ${new Date(slotIso).toLocaleString()}\n` +
      `🔖 Booking ID: ${appointment.id.slice(0, 8).toUpperCase()}\n\n` +
      `An automated reminder will be sent before your appointment.\n` +
      `Type "menu" anytime for other services.`
    );
  }

  // State: MONIKA_MODE
  if (session.currentState === 'MONIKA_MODE') {
    const triageResult = await monikaService.generateMonikaTriage({
      userPrompt: textContent,
      conversationHistory: [],
    });

    let reply = `👩‍⚕️ *MonikaCare AI Guidance:*\n\n`;

    if (triageResult.urgency === 'EMERGENCY') {
      reply += `🚨 *CRITICAL EMERGENCY ALERT* 🚨\n${triageResult.explanation}\n\n`;
      reply += `🚑 *Action Required:* Please call emergency services or visit the nearest ER immediately.\n\n`;
    } else {
      reply += `${triageResult.explanation}\n\n`;
      if (triageResult.precautions?.length) {
        reply += `🛡️ *Precautions:*\n` + triageResult.precautions.map(p => `• ${p}`).join('\n') + '\n\n';
      }
      if (triageResult.whatToAvoid?.length) {
        reply += `⚠️ *What to Avoid:*\n` + triageResult.whatToAvoid.map(a => `• ${a}`).join('\n') + '\n\n';
      }
      reply += `📊 *Urgency Level:* ${triageResult.urgency}\n`;
      reply += `💡 *Recommendation:* ${triageResult.recommendedAction}\n\n`;
    }

    reply += `_Disclaimer: ${triageResult.disclaimer}_\n\n(Type "menu" to return to main options)`;
    return await sendTextMessage(fromPhone, reply);
  }

  // Fallback
  return await sendWelcomeMenu(fromPhone);
};

const sendWelcomeMenu = async (toPhone) => {
  return await sendButtonMessage(
    toPhone,
    `👋 Welcome to *JeevanSYNC Healthcare Coordination*\n\nHow can we help you today?`,
    [
      { id: 'BTN_BOOK', title: '📅 Book Doctor' },
      { id: 'BTN_NEARBY', title: '📍 Nearby Hospitals' },
      { id: 'BTN_MONIKA', title: '👩‍⚕️ MonikaCare AI' },
    ]
  );
};

const sendSpecialtyMenu = async (toPhone) => {
  return await sendButtonMessage(
    toPhone,
    '🩺 Please select the medical specialty you require:',
    [
      { id: 'SPEC_Cardiology', title: '❤️ Cardiology' },
      { id: 'SPEC_General Medicine', title: '🩺 General Medicine' },
      { id: 'SPEC_Neurology', title: '🧠 Neurology' },
    ]
  );
};

const handleLocationMessage = async (toPhone, lat, lng) => {
  const nearby = await receptionService.getNearbyHospitals({ lat, lng, radiusKm: 25 });

  if (nearby.length === 0) {
    return await sendTextMessage(
      toPhone,
      'No registered hospitals found within 25km of your location. National Emergency Helpline: 112 / 108.'
    );
  }

  let msg = `📍 *Hospitals Nearest to You:*\n\n`;
  nearby.slice(0, 3).forEach((h, idx) => {
    msg += `${idx + 1}. *${h.name}* (~${h.distanceKm} km)\n`;
    msg += `   📍 ${h.address}, ${h.city}\n`;
    msg += `   📞 Helpline: ${h.contactPhone}\n`;
    msg += `   🚨 Emergency: ${h.emergencyContact}\n\n`;
  });

  msg += `Type "menu" to return to main options.`;
  await updateSession(toPhone, 'IDLE', {});
  return await sendTextMessage(toPhone, msg);
};

const sendBedBloodSummary = async (toPhone) => {
  const hospitals = await prisma.hospital.findMany({
    include: {
      bedAvailability: true,
      bloodInventory: true,
    },
    take: 3,
  });

  let msg = `🏥 *Live Emergency Bed & Blood Units:*\n\n`;
  hospitals.forEach((h) => {
    const icuBeds = h.bedAvailability.find((b) => b.wardType === 'ICU');
    const availableIcu = icuBeds ? Math.max(0, icuBeds.totalBeds - icuBeds.occupiedBeds) : 0;
    const totalBlood = h.bloodInventory.reduce((acc, curr) => acc + curr.unitsAvailable, 0);

    msg += `*${h.name}* (${h.city})\n`;
    msg += `• ICU Beds Available: ${availableIcu}\n`;
    msg += `• Blood Units in Stock: ${totalBlood} units\n`;
    msg += `• Emergency: ${h.emergencyContact}\n\n`;
  });

  msg += `Visit the JeevanSYNC portal for full real-time filtering.`;
  return await sendTextMessage(toPhone, msg);
};

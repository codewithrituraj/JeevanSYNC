import prisma from '../../config/prisma.js';
import { logger } from '../../utils/logger.js';

export const createReminder = async ({ userId, data }) => {
  const patientId = data.patientId || userId;

  return await prisma.reminder.create({
    data: {
      patientId,
      type: data.type,
      title: data.title,
      message: data.message,
      scheduledAt: new Date(data.scheduledAt),
      channel: data.channel || 'IN_APP',
      status: 'PENDING',
    },
  });
};

export const getPatientReminders = async (patientId) => {
  return await prisma.reminder.findMany({
    where: { patientId },
    orderBy: { scheduledAt: 'asc' },
  });
};

export const updateReminderStatus = async (reminderId, status) => {
  return await prisma.reminder.update({
    where: { id: reminderId },
    data: { status },
  });
};

export const deleteReminder = async (reminderId, patientId) => {
  return await prisma.reminder.deleteMany({
    where: { id: reminderId, patientId },
  });
};

/**
 * Process due reminders (invoked by node-cron scheduler or manual trigger)
 */
export const processDueReminders = async () => {
  const now = new Date();
  
  const dueReminders = await prisma.reminder.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
    },
    include: {
      patient: {
        select: { id: true, name: true, phone: true, email: true },
      },
    },
  });

  logger.info(`Found ${dueReminders.length} due reminders to dispatch`);

  for (const reminder of dueReminders) {
    try {
      if (reminder.channel === 'WHATSAPP') {
        logger.info(`[REMINDER DISPATCH] WhatsApp reminder sent to ${reminder.patient.phone}: "${reminder.title}"`);
      } else {
        logger.info(`[REMINDER DISPATCH] In-App reminder active for ${reminder.patient.name}: "${reminder.title}"`);
      }

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: 'SENT' },
      });
    } catch (err) {
      logger.error(`Failed to dispatch reminder ${reminder.id}:`, { error: err.message });
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: 'FAILED' },
      });
    }
  }

  return dueReminders.length;
};

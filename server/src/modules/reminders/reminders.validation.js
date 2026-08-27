import { z } from 'zod';

export const createReminderSchema = z.object({
  body: z.object({
    patientId: z.string().uuid().optional(), // defaults to current user if patient
    type: z.enum(['APPOINTMENT', 'MEDICATION', 'LAB_RESULT', 'FOLLOW_UP']),
    title: z.string().min(2, 'Title is required'),
    message: z.string().min(2, 'Message is required'),
    scheduledAt: z.string().datetime({ message: 'Valid ISO 8601 datetime required' }),
    channel: z.enum(['WHATSAPP', 'IN_APP']).optional().default('IN_APP'),
  }),
});

export const updateReminderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'SENT', 'FAILED']),
  }),
});

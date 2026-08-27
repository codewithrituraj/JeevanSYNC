import { z } from 'zod';

export const chatSchema = z.object({
  body: z.object({
    sessionId: z.string().min(3, 'Valid session ID is required'),
    prompt: z.string().min(2, 'Message cannot be empty').max(2000, 'Message is too long'),
  }),
});

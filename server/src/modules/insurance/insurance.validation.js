import { z } from 'zod';

export const checkInsuranceSchema = z.object({
  query: z.object({
    hospitalId: z.string().uuid().optional(),
    providerId: z.string().uuid().optional(),
    isCashless: z.string().optional().transform(v => (v !== undefined ? v === 'true' : undefined)),
  }).optional(),
});

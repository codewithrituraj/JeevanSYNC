import { z } from 'zod';

export const bloodSearchSchema = z.object({
  query: z.object({
    bloodGroup: z.enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG']).optional(),
    city: z.string().optional(),
    minUnits: z.string().optional().transform(v => (v ? Number(v) : 0)),
  }).optional(),
});

export const updateBloodStockSchema = z.object({
  body: z.object({
    hospitalId: z.string().uuid('Hospital ID is required'),
    bloodGroup: z.enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG']),
    unitsAvailable: z.number().int().min(0, 'Units cannot be negative'),
  }),
});

import { z } from 'zod';

export const searchMedicineSchema = z.object({
  query: z.object({
    query: z.string().optional(),
    hospitalId: z.string().uuid().optional(),
    inStockOnly: z.string().optional().transform(v => v === 'true'),
  }).optional(),
});

export const createMedicineSchema = z.object({
  body: z.object({
    hospitalId: z.string().uuid('Hospital ID is required'),
    medicineName: z.string().min(2, 'Medicine name is required'),
    genericName: z.string().min(2, 'Generic name is required'),
    dosageForm: z.string().min(1, 'Dosage form is required'),
    strength: z.string().min(1, 'Strength is required'),
    stockQty: z.number().int().min(0),
    price: z.number().min(0),
    alternatives: z.array(z.object({
      name: z.string(),
      generic: z.string(),
      manufacturer: z.string().optional(),
      price: z.number().optional(),
      inStock: z.boolean().optional().default(true),
    })).optional(),
  }),
});

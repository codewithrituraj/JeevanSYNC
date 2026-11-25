import { z } from 'zod';

export const searchTestsSchema = z.object({
  query: z.object({
    query: z.string().optional(),
    category: z.string().optional(),
    city: z.string().optional(),
    maxPrice: z.string().optional().transform(v => (v ? Number(v) : undefined)),
    sortBy: z.enum(['price_asc', 'price_desc', 'turnaround_asc', 'name_asc']).optional().default('price_asc'),
  }).optional(),
});

export const createTestSchema = z.object({
  body: z.object({
    hospitalId: z.string().uuid('Hospital ID is required'),
    testName: z.string().min(2, 'Test name is required'),
    category: z.string().min(2, 'Category is required'),
    price: z.number().positive('Price must be positive'),
    turnaroundHours: z.number().int().positive().optional().default(24),
    sampleType: z.string().optional(),
    prerequisites: z.string().optional(),
    available: z.boolean().optional().default(true),
  }),
});

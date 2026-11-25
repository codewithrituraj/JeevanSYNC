import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    role: z.enum(['PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTION_STAFF', 'SUPER_ADMIN']).optional().default('PATIENT'),
    hospitalId: z.string().uuid().optional(),
    // Doctor-specific optional fields
    specialty: z.string().optional(),
    qualification: z.string().optional(),
    experienceYears: z.number().int().nonnegative().optional(),
    consultationFee: z.number().nonnegative().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(3, 'Phone or email is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
});

import { z } from 'zod';

export const createReferralSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Valid Patient ID is required'),
    fromHospitalId: z.string().uuid('From Hospital ID is required'),
    toHospitalId: z.string().uuid('To Hospital ID is required'),
    reason: z.string().min(5, 'Clinical referral reason is required'),
    recordSnapshot: z.object({
      initialDiagnosis: z.string().optional(),
      referringPhysician: z.string().optional(),
      clinicalSummary: z.string().optional(),
      vitalSigns: z.string().optional(),
      medications: z.array(z.string()).optional(),
    }).optional(),
  }),
});

export const updateReferralStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED']),
  }),
});

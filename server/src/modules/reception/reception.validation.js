import { z } from 'zod';

export const nearbyHospitalsSchema = z.object({
  query: z.object({
    lat: z.string().transform(Number),
    lng: z.string().transform(Number),
    radiusKm: z.string().optional().transform(v => (v ? Number(v) : 50)),
  }),
});

export const searchDoctorsSchema = z.object({
  query: z.object({
    hospitalId: z.string().uuid().optional(),
    specialty: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
});

export const bookAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().uuid().optional(),
    doctorId: z.string().uuid('Doctor ID is required'),
    hospitalId: z.string().uuid('Hospital ID is required'),
    slotTime: z.string().datetime({ message: 'Valid ISO slotTime is required' }),
    notes: z.string().optional(),
    source: z.enum(['WEB', 'WHATSAPP']).optional().default('WEB'),
  }),
});

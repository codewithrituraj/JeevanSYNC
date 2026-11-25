import { z } from 'zod';

export const requestAmbulanceSchema = z.object({
  body: z.object({
    patientId: z.string().uuid().optional(),
    patientName: z.string().min(2, 'Patient name is required'),
    patientPhone: z.string().min(10, 'Valid 10-digit phone number is required'),
    pickupLatitude: z.number({ required_error: 'Latitude is required' }),
    pickupLongitude: z.number({ required_error: 'Longitude is required' }),
    pickupAddress: z.string().min(5, 'Pickup address is required'),
    hospitalId: z.string().uuid().optional(),
    urgencyLevel: z.enum(['HIGH', 'CRITICAL']).optional().default('CRITICAL'),
    notes: z.string().optional(),
  }),
});

export const updateAmbulanceStatusSchema = z.object({
  body: z.object({
    status: z.enum(['REQUESTED', 'DISPATCHED', 'EN_ROUTE', 'COMPLETED', 'CANCELLED']),
    hospitalId: z.string().uuid().optional(),
    notes: z.string().optional(),
  }),
});

export const updateBedSchema = z.object({
  body: z.object({
    hospitalId: z.string().uuid('Hospital ID is required'),
    wardType: z.enum(['GENERAL', 'ICU', 'HDU', 'NICU', 'PEDIATRIC', 'EMERGENCY']),
    totalBeds: z.number().int().min(0),
    occupiedBeds: z.number().int().min(0),
  }),
});

export const searchBedsSchema = z.object({
  query: z.object({
    city: z.string().optional(),
    wardType: z.enum(['GENERAL', 'ICU', 'HDU', 'NICU', 'PEDIATRIC', 'EMERGENCY']).optional(),
  }).optional(),
});

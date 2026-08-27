import { z } from 'zod';

export const createRecordSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Valid patient ID required'),
    hospitalId: z.string().uuid().optional(),
    doctorId: z.string().uuid().optional(),
    recordType: z.enum(['CONSULTATION', 'LAB_REPORT', 'PRESCRIPTION', 'DISCHARGE_SUMMARY', 'TRIAGE_SUMMARY']),
    clinicalData: z.object({
      symptoms: z.string().optional(),
      diagnosis: z.string().optional(),
      clinicalNotes: z.string().optional(),
      prescriptions: z.array(z.object({
        medicine: z.string(),
        dosage: z.string(),
        duration: z.string().optional(),
        instructions: z.string().optional(),
      })).optional(),
      precautions: z.string().optional(),
      labResults: z.any().optional(),
      attachments: z.array(z.string()).optional(),
    }),
    metadata: z.object({
      department: z.string().optional(),
      visitDate: z.string().optional(),
      doctorName: z.string().optional(),
      hospitalName: z.string().optional(),
    }).optional(),
  }),
});

export const getTimelineSchema = z.object({
  params: z.object({
    patientId: z.string().uuid('Valid patient ID required'),
  }),
  query: z.object({
    recordType: z.enum(['CONSULTATION', 'LAB_REPORT', 'PRESCRIPTION', 'DISCHARGE_SUMMARY', 'TRIAGE_SUMMARY']).optional(),
  }).optional(),
});

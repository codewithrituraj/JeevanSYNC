import { Router } from 'express';
import * as patientHistoryController from './patient-history.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createRecordSchema, getTimelineSchema } from './patient-history.validation.js';

const router = Router();

// Create medical record: Doctors, Hospital Admins, Super Admin
router.post(
  '/',
  authenticate,
  requireRoles('DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  validate(createRecordSchema),
  patientHistoryController.createRecord
);

// Get patient history timeline: Patient (own), Doctors, Admins
router.get(
  '/patient/:patientId',
  authenticate,
  validate(getTimelineSchema),
  patientHistoryController.getTimeline
);

// Get my own timeline
router.get(
  '/my-history',
  authenticate,
  patientHistoryController.getTimeline
);

// Get individual record detail
router.get(
  '/:id',
  authenticate,
  patientHistoryController.getRecordById
);

export default router;

import { Router } from 'express';
import * as referralController from './referral.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createReferralSchema, updateReferralStatusSchema } from './referral.validation.js';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRoles('DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  validate(createReferralSchema),
  referralController.createReferral
);

router.get('/my', authenticate, referralController.getReferrals);

router.patch(
  '/:id/status',
  authenticate,
  requireRoles('DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTION_STAFF', 'SUPER_ADMIN'),
  validate(updateReferralStatusSchema),
  referralController.updateStatus
);

export default router;

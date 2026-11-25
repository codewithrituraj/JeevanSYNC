import { Router } from 'express';
import * as bloodbankController from './bloodbank.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { bloodSearchSchema, updateBloodStockSchema } from './bloodbank.validation.js';

const router = Router();

// Publicly readable blood stock
router.get('/availability', validate(bloodSearchSchema), bloodbankController.getAvailability);
router.get('/hospital/:hospitalId', bloodbankController.getHospitalBlood);

// Modifiable by Hospital Staff and Super Admin
router.post(
  '/update',
  authenticate,
  requireRoles('HOSPITAL_ADMIN', 'RECEPTION_STAFF', 'SUPER_ADMIN'),
  validate(updateBloodStockSchema),
  bloodbankController.updateUnits
);

export default router;

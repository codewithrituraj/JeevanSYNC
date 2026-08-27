import { Router } from 'express';
import * as coordinationController from './coordination.controller.js';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  requestAmbulanceSchema,
  updateAmbulanceStatusSchema,
  updateBedSchema,
  searchBedsSchema,
} from './coordination.validation.js';

const router = Router();

// Ambulance Routes
router.post('/ambulance/request', optionalAuth, validate(requestAmbulanceSchema), coordinationController.requestAmbulance);
router.get('/ambulance/requests', authenticate, coordinationController.getAmbulanceList);
router.get('/ambulance/:id', coordinationController.getAmbulanceStatus);
router.patch(
  '/ambulance/:id/status',
  authenticate,
  requireRoles('HOSPITAL_ADMIN', 'RECEPTION_STAFF', 'SUPER_ADMIN'),
  validate(updateAmbulanceStatusSchema),
  coordinationController.updateAmbulanceStatus
);

// Bed Availability Routes
router.get('/beds', validate(searchBedsSchema), coordinationController.getBedAvailability);
router.post(
  '/beds/update',
  authenticate,
  requireRoles('HOSPITAL_ADMIN', 'RECEPTION_STAFF', 'SUPER_ADMIN'),
  validate(updateBedSchema),
  coordinationController.updateBeds
);

export default router;

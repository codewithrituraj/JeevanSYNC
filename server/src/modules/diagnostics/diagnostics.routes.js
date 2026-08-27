import { Router } from 'express';
import * as diagnosticsController from './diagnostics.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { searchTestsSchema, createTestSchema } from './diagnostics.validation.js';

const router = Router();

router.get('/search', validate(searchTestsSchema), diagnosticsController.searchTests);
router.get('/categories', diagnosticsController.getCategories);
router.get('/compare', diagnosticsController.comparePrices);

router.post(
  '/',
  authenticate,
  requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  validate(createTestSchema),
  diagnosticsController.createTest
);

export default router;

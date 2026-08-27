import { Router } from 'express';
import * as inventoryController from './inventory.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { searchMedicineSchema, createMedicineSchema } from './inventory.validation.js';

const router = Router();

router.get('/search', validate(searchMedicineSchema), inventoryController.searchMedicines);
router.get('/:id', inventoryController.getMedicineById);

router.post(
  '/',
  authenticate,
  requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  validate(createMedicineSchema),
  inventoryController.createMedicine
);

router.patch(
  '/:id/stock',
  authenticate,
  requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  inventoryController.updateStock
);

export default router;

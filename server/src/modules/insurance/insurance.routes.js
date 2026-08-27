import { Router } from 'express';
import * as insuranceController from './insurance.controller.js';
import { validate } from '../../middleware/validate.js';
import { checkInsuranceSchema } from './insurance.validation.js';

const router = Router();

router.get('/providers', insuranceController.getProviders);
router.get('/check', validate(checkInsuranceSchema), insuranceController.checkCoverage);

export default router;

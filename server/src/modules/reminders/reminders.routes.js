import { Router } from 'express';
import * as reminderController from './reminders.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createReminderSchema, updateReminderStatusSchema } from './reminders.validation.js';

const router = Router();

router.post('/', authenticate, validate(createReminderSchema), reminderController.createReminder);
router.get('/my-reminders', authenticate, reminderController.getMyReminders);
router.patch('/:id/status', authenticate, validate(updateReminderStatusSchema), reminderController.updateStatus);
router.delete('/:id', authenticate, reminderController.deleteReminder);
router.post('/trigger-due', authenticate, requireRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN'), reminderController.triggerDue);

export default router;

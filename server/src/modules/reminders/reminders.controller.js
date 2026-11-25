import * as reminderService from './reminders.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const createReminder = async (req, res) => {
  try {
    const reminder = await reminderService.createReminder({
      userId: req.user.id,
      data: req.validated.body,
    });
    return sendSuccess(res, reminder, 201, 'Reminder scheduled successfully');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getMyReminders = async (req, res) => {
  try {
    const reminders = await reminderService.getPatientReminders(req.user.id);
    return sendSuccess(res, reminders);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const updated = await reminderService.updateReminderStatus(req.params.id, req.validated.body.status);
    return sendSuccess(res, updated, 200, 'Reminder status updated');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const deleteReminder = async (req, res) => {
  try {
    await reminderService.deleteReminder(req.params.id, req.user.id);
    return sendSuccess(res, null, 200, 'Reminder deleted');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const triggerDue = async (req, res) => {
  try {
    const count = await reminderService.processDueReminders();
    return sendSuccess(res, { dispatchedCount: count }, 200, `Processed ${count} due reminders`);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

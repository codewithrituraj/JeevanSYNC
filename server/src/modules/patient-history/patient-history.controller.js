import * as patientHistoryService from './patient-history.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const createRecord = async (req, res) => {
  try {
    const record = await patientHistoryService.createPatientRecord({
      creatorId: req.user.id,
      data: req.validated.body,
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_PATIENT_RECORD',
      resource: 'patient_history',
      resourceId: record.id,
      req,
      details: { patientId: req.validated.body.patientId, recordType: record.recordType },
    });

    return sendSuccess(res, record, 201, 'Medical record created securely');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getTimeline = async (req, res) => {
  try {
    const patientId = req.params.patientId || req.user.id;
    const recordTypeFilter = req.query.recordType || null;

    const records = await patientHistoryService.getPatientRecords({
      patientId,
      requestingUser: req.user,
      recordTypeFilter,
    });

    await logAudit({
      userId: req.user.id,
      action: 'VIEW_PATIENT_TIMELINE',
      resource: 'patient_history',
      resourceId: patientId,
      req,
      details: { recordCount: records.length, recordTypeFilter },
    });

    return sendSuccess(res, records);
  } catch (error) {
    return sendError(res, error.message, error.message.includes('Forbidden') ? 403 : 400);
  }
};

export const getRecordById = async (req, res) => {
  try {
    const record = await patientHistoryService.getRecordById({
      recordId: req.params.id,
      requestingUser: req.user,
    });

    await logAudit({
      userId: req.user.id,
      action: 'VIEW_RECORD_DETAIL',
      resource: 'patient_history',
      resourceId: record.id,
      req,
      details: { patientId: record.patientId },
    });

    return sendSuccess(res, record);
  } catch (error) {
    return sendError(res, error.message, error.message.includes('Forbidden') ? 403 : 404);
  }
};

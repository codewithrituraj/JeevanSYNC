import * as bloodbankService from './bloodbank.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const getAvailability = async (req, res) => {
  try {
    const data = await bloodbankService.getBloodAvailability(req.query || {});
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getHospitalBlood = async (req, res) => {
  try {
    const data = await bloodbankService.getBloodSummaryByHospital(req.params.hospitalId);
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateUnits = async (req, res) => {
  try {
    const updated = await bloodbankService.updateBloodUnits(req.validated.body);

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_BLOOD_STOCK',
      resource: 'blood_inventory',
      resourceId: updated.id,
      req,
      details: { hospitalId: req.validated.body.hospitalId, bloodGroup: req.validated.body.bloodGroup, units: req.validated.body.unitsAvailable },
    });

    return sendSuccess(res, updated, 200, 'Blood units updated successfully');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

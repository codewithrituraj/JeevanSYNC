import * as referralService from './referral.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const createReferral = async (req, res) => {
  try {
    const referral = await referralService.createReferral(req.validated.body);

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_PATIENT_REFERRAL',
      resource: 'referrals',
      resourceId: referral.id,
      req,
      details: {
        patientId: req.validated.body.patientId,
        from: req.validated.body.fromHospitalId,
        to: req.validated.body.toHospitalId,
      },
    });

    return sendSuccess(res, referral, 201, 'Patient digital referral created');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getReferrals = async (req, res) => {
  try {
    const referrals = await referralService.getReferralsForUser(req.user);
    return sendSuccess(res, referrals);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const updated = await referralService.updateReferralStatus(req.params.id, req.validated.body.status);

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_REFERRAL_STATUS',
      resource: 'referrals',
      resourceId: updated.id,
      req,
      details: { status: req.validated.body.status },
    });

    return sendSuccess(res, updated, 200, 'Referral status updated');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

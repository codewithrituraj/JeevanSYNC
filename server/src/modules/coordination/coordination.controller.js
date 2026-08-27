import * as coordinationService from './coordination.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const requestAmbulance = async (req, res) => {
  try {
    const ambulance = await coordinationService.requestAmbulance(req.validated.body);

    await logAudit({
      userId: req.user?.id || null,
      action: 'REQUEST_AMBULANCE',
      resource: 'ambulance_requests',
      resourceId: ambulance.id,
      req,
      details: {
        patientName: ambulance.patientName,
        phone: ambulance.patientPhone,
        address: ambulance.pickupAddress,
        urgency: ambulance.urgencyLevel,
      },
    });

    return sendSuccess(res, ambulance, 201, 'Ambulance dispatch requested immediately');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const updateAmbulanceStatus = async (req, res) => {
  try {
    const updated = await coordinationService.updateAmbulanceStatus(req.params.id, req.validated.body);

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_AMBULANCE_STATUS',
      resource: 'ambulance_requests',
      resourceId: updated.id,
      req,
      details: { newStatus: req.validated.body.status },
    });

    return sendSuccess(res, updated, 200, 'Ambulance status updated');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getAmbulanceList = async (req, res) => {
  try {
    const list = await coordinationService.getAmbulanceRequests(req.user);
    return sendSuccess(res, list);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getAmbulanceStatus = async (req, res) => {
  try {
    const record = await coordinationService.getAmbulanceById(req.params.id);
    if (!record) {
      return sendError(res, 'Ambulance dispatch record not found', 404);
    }
    return sendSuccess(res, record);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// Bed Availability Controllers
export const getBedAvailability = async (req, res) => {
  try {
    const data = await coordinationService.getBedAvailability(req.query || {});
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateBeds = async (req, res) => {
  try {
    const updated = await coordinationService.updateBedStock(req.validated.body);

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_BED_AVAILABILITY',
      resource: 'bed_availability',
      resourceId: updated.id,
      req,
      details: {
        hospitalId: req.validated.body.hospitalId,
        wardType: req.validated.body.wardType,
        totalBeds: req.validated.body.totalBeds,
        occupiedBeds: req.validated.body.occupiedBeds,
      },
    });

    return sendSuccess(res, updated, 200, 'Bed counts updated');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

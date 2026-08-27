import * as receptionService from './reception.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const getNearbyHospitals = async (req, res) => {
  try {
    const { lat, lng, radiusKm } = req.validated.query;
    const hospitals = await receptionService.getNearbyHospitals({ lat, lng, radiusKm });
    return sendSuccess(res, hospitals);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getAllHospitals = async (req, res) => {
  try {
    const { city } = req.query;
    const hospitals = await receptionService.getAllHospitals(city);
    return sendSuccess(res, hospitals);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getHospitalById = async (req, res) => {
  try {
    const hospital = await receptionService.getHospitalById(req.params.id);
    if (!hospital) {
      return sendError(res, 'Hospital not found', 404);
    }
    return sendSuccess(res, hospital);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const searchDoctors = async (req, res) => {
  try {
    const doctors = await receptionService.searchDoctors(req.query);
    return sendSuccess(res, doctors);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getDoctorSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    if (!date) {
      return sendError(res, 'date query parameter is required (YYYY-MM-DD)', 400);
    }
    const slots = await receptionService.getDoctorAvailableSlots(doctorId, date);
    return sendSuccess(res, slots);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const bookAppointment = async (req, res) => {
  try {
    const patientId = req.validated.body.patientId || req.user?.id;
    if (!patientId) {
      return sendError(res, 'Patient ID is required for booking', 400);
    }

    const appointment = await receptionService.bookAppointment({
      ...req.validated.body,
      patientId,
    });

    await logAudit({
      userId: req.user?.id || patientId,
      action: 'BOOK_APPOINTMENT',
      resource: 'appointments',
      resourceId: appointment.id,
      req,
      details: { doctorId: appointment.doctorId, hospitalId: appointment.hospitalId },
    });

    return sendSuccess(res, appointment, 201, 'Appointment booked successfully');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await receptionService.getAppointmentsForUser(req.user);
    return sendSuccess(res, appointments);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

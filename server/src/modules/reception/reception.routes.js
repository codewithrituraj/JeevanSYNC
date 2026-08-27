import { Router } from 'express';
import * as receptionController from './reception.controller.js';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { nearbyHospitalsSchema, searchDoctorsSchema, bookAppointmentSchema } from './reception.validation.js';

const router = Router();

router.get('/hospitals/nearby', validate(nearbyHospitalsSchema), receptionController.getNearbyHospitals);
router.get('/hospitals', receptionController.getAllHospitals);
router.get('/hospitals/:id', receptionController.getHospitalById);

router.get('/doctors', validate(searchDoctorsSchema), receptionController.searchDoctors);
router.get('/doctors/:doctorId/slots', receptionController.getDoctorSlots);

router.post('/appointments/book', optionalAuth, validate(bookAppointmentSchema), receptionController.bookAppointment);
router.get('/appointments/my', authenticate, receptionController.getMyAppointments);

export default router;

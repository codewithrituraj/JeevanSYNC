import prisma from '../../config/prisma.js';

// Haversine formula to compute great-circle distance in kilometers
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

const parseDbJson = (data) => {
  if (!data) return null;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

export const getNearbyHospitals = async ({ lat, lng, radiusKm = 50 }) => {
  const hospitals = await prisma.hospital.findMany({
    where: { isVerified: true },
    include: {
      bedAvailability: true,
      bloodInventory: true,
    },
  });

  const withDistance = hospitals.map((h) => {
    const distanceKm = calculateDistanceKm(lat, lng, h.latitude, h.longitude);
    return {
      ...h,
      distanceKm,
    };
  });

  return withDistance
    .filter((h) => h.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
};

export const getAllHospitals = async (city = null) => {
  return await prisma.hospital.findMany({
    where: {
      isVerified: true,
      ...(city ? { city: { contains: city } } : {}),
    },
    include: {
      doctors: {
        where: { isActive: true },
        include: { user: { select: { name: true, phone: true, email: true } } },
      },
      bedAvailability: true,
    },
    orderBy: { name: 'asc' },
  });
};

export const getHospitalById = async (hospitalId) => {
  return await prisma.hospital.findUnique({
    where: { id: hospitalId },
    include: {
      doctors: {
        where: { isActive: true },
        include: { user: { select: { name: true, phone: true, email: true } } },
      },
      bedAvailability: true,
      bloodInventory: true,
      diagnosticTests: true,
      insuranceLinks: {
        include: { insuranceProvider: true },
      },
    },
  });
};

export const searchDoctors = async ({ hospitalId, specialty, city }) => {
  const where = {
    isActive: true,
    ...(specialty ? { specialty: { contains: specialty } } : {}),
    ...(hospitalId ? { hospitalId } : {}),
    ...(city ? { hospital: { city: { contains: city } } } : {}),
  };

  const doctors = await prisma.doctor.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      hospital: { select: { id: true, name: true, city: true, address: true } },
    },
  });

  return doctors.map((doc) => ({
    ...doc,
    schedule: parseDbJson(doc.scheduleJson),
  }));
};

export const getDoctorAvailableSlots = async (doctorId, dateString) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { hospital: true, user: true },
  });

  if (!doctor) {
    throw new Error('Doctor not found');
  }

  const schedule = parseDbJson(doctor.scheduleJson) || {
    monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    thursday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    friday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    saturday: ['10:00', '11:00', '12:00'],
  };

  const targetDate = new Date(dateString);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[targetDate.getDay()];

  const daySlots = schedule[dayName] || [];

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingBookings = await prisma.appointment.findMany({
    where: {
      doctorId,
      slotTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: { notIn: ['CANCELLED'] },
    },
  });

  const bookedHours = existingBookings.map((b) => {
    const d = new Date(b.slotTime);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  return daySlots.map((timeStr) => ({
    time: timeStr,
    available: !bookedHours.includes(timeStr),
  }));
};

export const bookAppointment = async ({ patientId, doctorId, hospitalId, slotTime, notes, source = 'WEB' }) => {
  const slotDate = new Date(slotTime);

  // Conflict Check
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      slotTime: slotDate,
      status: { notIn: ['CANCELLED'] },
    },
  });

  if (conflict) {
    throw new Error('This appointment slot is already booked. Please choose another time.');
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      hospitalId,
      slotTime: slotDate,
      notes,
      source,
      status: 'CONFIRMED',
    },
    include: {
      patient: { select: { id: true, name: true, phone: true, email: true } },
      doctor: {
        include: {
          user: { select: { name: true } },
        },
      },
      hospital: { select: { id: true, name: true, address: true, city: true, emergencyContact: true } },
    },
  });

  // Automatically create an appointment reminder
  try {
    const reminderTime = new Date(slotDate);
    reminderTime.setHours(reminderTime.getHours() - 2); // 2 hours before

    await prisma.reminder.create({
      data: {
        patientId,
        type: 'APPOINTMENT',
        title: `Appointment with Dr. ${appointment.doctor.user.name}`,
        message: `Your appointment is confirmed for ${slotDate.toLocaleString()} at ${appointment.hospital.name}.`,
        scheduledAt: reminderTime > new Date() ? reminderTime : slotDate,
        channel: source === 'WHATSAPP' ? 'WHATSAPP' : 'IN_APP',
      },
    });
  } catch {
    // Non-blocking reminder creation
  }

  return appointment;
};

export const getAppointmentsForUser = async (user) => {
  if (user.role === 'PATIENT') {
    return await prisma.appointment.findMany({
      where: { patientId: user.id },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        hospital: { select: { id: true, name: true, address: true, city: true } },
      },
      orderBy: { slotTime: 'desc' },
    });
  } else if (user.role === 'DOCTOR') {
    const doc = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (!doc) return [];
    return await prisma.appointment.findMany({
      where: { doctorId: doc.id },
      include: {
        patient: { select: { id: true, name: true, phone: true, email: true } },
        hospital: { select: { id: true, name: true } },
      },
      orderBy: { slotTime: 'asc' },
    });
  } else if (user.role === 'HOSPITAL_ADMIN' || user.role === 'RECEPTION_STAFF') {
    return await prisma.appointment.findMany({
      where: { hospitalId: user.hospitalId },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { slotTime: 'asc' },
    });
  }

  return await prisma.appointment.findMany({
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      doctor: { include: { user: { select: { name: true } } } },
      hospital: { select: { id: true, name: true } },
    },
    orderBy: { slotTime: 'desc' },
  });
};

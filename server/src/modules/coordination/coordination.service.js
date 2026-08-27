import prisma from '../../config/prisma.js';

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
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

export const requestAmbulance = async (data) => {
  let targetHospitalId = data.hospitalId;

  // If no specific hospital chosen, auto-assign the nearest verified hospital
  if (!targetHospitalId) {
    const hospitals = await prisma.hospital.findMany({ where: { isVerified: true } });
    if (hospitals.length > 0) {
      let nearest = hospitals[0];
      let minDistance = calculateDistanceKm(
        data.pickupLatitude,
        data.pickupLongitude,
        nearest.latitude,
        nearest.longitude
      );

      for (let i = 1; i < hospitals.length; i++) {
        const d = calculateDistanceKm(
          data.pickupLatitude,
          data.pickupLongitude,
          hospitals[i].latitude,
          hospitals[i].longitude
        );
        if (d < minDistance) {
          minDistance = d;
          nearest = hospitals[i];
        }
      }
      targetHospitalId = nearest.id;
    }
  }

  return await prisma.ambulanceRequest.create({
    data: {
      patientId: data.patientId || null,
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      pickupLatitude: data.pickupLatitude,
      pickupLongitude: data.pickupLongitude,
      pickupAddress: data.pickupAddress,
      hospitalId: targetHospitalId || null,
      urgencyLevel: data.urgencyLevel || 'CRITICAL',
      status: 'REQUESTED',
      notes: data.notes || null,
    },
    include: {
      hospital: {
        select: {
          id: true,
          name: true,
          emergencyContact: true,
          contactPhone: true,
          address: true,
        },
      },
    },
  });
};

export const updateAmbulanceStatus = async (id, { status, hospitalId, notes }) => {
  const data = {
    status,
    ...(hospitalId ? { hospitalId } : {}),
    ...(notes ? { notes } : {}),
    ...(status === 'DISPATCHED' ? { dispatchedAt: new Date() } : {}),
  };

  return await prisma.ambulanceRequest.update({
    where: { id },
    data,
    include: {
      hospital: {
        select: {
          id: true,
          name: true,
          emergencyContact: true,
        },
      },
    },
  });
};

export const getAmbulanceRequests = async (user) => {
  if (user.role === 'PATIENT') {
    return await prisma.ambulanceRequest.findMany({
      where: {
        OR: [
          { patientId: user.id },
          { patientPhone: user.phone },
        ],
      },
      include: { hospital: true },
      orderBy: { createdAt: 'desc' },
    });
  } else if (user.role === 'HOSPITAL_ADMIN' || user.role === 'RECEPTION_STAFF') {
    return await prisma.ambulanceRequest.findMany({
      where: { hospitalId: user.hospitalId },
      include: { patient: { select: { name: true, phone: true } }, hospital: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  return await prisma.ambulanceRequest.findMany({
    include: {
      hospital: { select: { name: true, emergencyContact: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getAmbulanceById = async (id) => {
  return await prisma.ambulanceRequest.findUnique({
    where: { id },
    include: {
      hospital: true,
    },
  });
};

// Bed Availability Services
export const getBedAvailability = async ({ city, wardType } = {}) => {
  const where = {
    ...(wardType ? { wardType } : {}),
    ...(city ? { hospital: { city: { contains: city } } } : {}),
  };

  const beds = await prisma.bedAvailability.findMany({
    where,
    include: {
      hospital: {
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          contactPhone: true,
          emergencyContact: true,
          latitude: true,
          longitude: true,
        },
      },
    },
    orderBy: [
      { wardType: 'asc' },
      { hospital: { name: 'asc' } },
    ],
  });

  return beds.map((b) => ({
    ...b,
    availableBeds: Math.max(0, b.totalBeds - b.occupiedBeds),
    occupancyRate: b.totalBeds > 0 ? Math.round((b.occupiedBeds / b.totalBeds) * 100) : 0,
  }));
};

export const updateBedStock = async ({ hospitalId, wardType, totalBeds, occupiedBeds }) => {
  return await prisma.bedAvailability.upsert({
    where: {
      hospitalId_wardType: {
        hospitalId,
        wardType,
      },
    },
    update: {
      totalBeds,
      occupiedBeds,
      updatedAt: new Date(),
    },
    create: {
      hospitalId,
      wardType,
      totalBeds,
      occupiedBeds,
    },
    include: {
      hospital: { select: { id: true, name: true } },
    },
  });
};

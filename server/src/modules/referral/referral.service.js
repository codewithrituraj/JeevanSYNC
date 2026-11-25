import prisma from '../../config/prisma.js';

const toDbJson = (data) => {
  if (data === null || data === undefined) return null;
  return typeof data === 'string' ? data : JSON.stringify(data);
};

const parseDbJson = (data) => {
  if (!data) return {};
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
};

export const createReferral = async (data) => {
  const { patientId, fromHospitalId, toHospitalId, reason, recordSnapshot } = data;

  const referral = await prisma.referral.create({
    data: {
      patientId,
      fromHospitalId,
      toHospitalId,
      reason,
      recordSnapshotJson: toDbJson(recordSnapshot || {}),
      status: 'PENDING',
    },
    include: {
      patient: { select: { id: true, name: true, phone: true, email: true } },
      fromHospital: { select: { id: true, name: true, city: true } },
      toHospital: { select: { id: true, name: true, city: true, contactPhone: true } },
    },
  });

  return {
    ...referral,
    recordSnapshot: parseDbJson(referral.recordSnapshotJson),
  };
};

export const getReferralsForUser = async (user) => {
  let where = {};

  if (user.role === 'PATIENT') {
    where = { patientId: user.id };
  } else if (user.role === 'DOCTOR' || user.role === 'HOSPITAL_ADMIN' || user.role === 'RECEPTION_STAFF') {
    if (user.hospitalId) {
      where = {
        OR: [
          { fromHospitalId: user.hospitalId },
          { toHospitalId: user.hospitalId },
        ],
      };
    }
  }

  const referrals = await prisma.referral.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      fromHospital: { select: { id: true, name: true, city: true } },
      toHospital: { select: { id: true, name: true, city: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return referrals.map((r) => ({
    ...r,
    recordSnapshot: parseDbJson(r.recordSnapshotJson),
  }));
};

export const updateReferralStatus = async (id, status) => {
  const updated = await prisma.referral.update({
    where: { id },
    data: { status, updatedAt: new Date() },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      fromHospital: { select: { id: true, name: true } },
      toHospital: { select: { id: true, name: true } },
    },
  });

  return {
    ...updated,
    recordSnapshot: parseDbJson(updated.recordSnapshotJson),
  };
};

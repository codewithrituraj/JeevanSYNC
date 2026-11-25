import prisma from '../../config/prisma.js';
import { encrypt, decrypt } from '../../utils/crypto.js';

const toDbJson = (data) => {
  if (data === null || data === undefined) return null;
  return typeof data === 'string' ? data : JSON.stringify(data);
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

export const createPatientRecord = async ({ creatorId, data }) => {
  const { patientId, hospitalId, doctorId, recordType, clinicalData, metadata } = data;

  const encryptedData = encrypt(clinicalData);

  const record = await prisma.patientHistory.create({
    data: {
      patientId,
      hospitalId: hospitalId || null,
      doctorId: doctorId || null,
      recordType,
      encryptedData,
      metadataJson: toDbJson(metadata || {
        visitDate: new Date().toISOString().split('T')[0],
      }),
      createdBy: creatorId,
    },
    include: {
      hospital: { select: { id: true, name: true, city: true } },
      doctor: {
        include: {
          user: { select: { name: true } },
        },
      },
      creator: { select: { id: true, name: true, role: true } },
    },
  });

  return {
    id: record.id,
    patientId: record.patientId,
    recordType: record.recordType,
    clinicalData: decrypt(record.encryptedData),
    metadata: parseDbJson(record.metadataJson),
    hospital: record.hospital,
    doctor: record.doctor ? {
      id: record.doctor.id,
      name: record.doctor.user.name,
      specialty: record.doctor.specialty,
    } : null,
    creator: record.creator,
    createdAt: record.createdAt,
  };
};

export const getPatientRecords = async ({ patientId, requestingUser, recordTypeFilter = null }) => {
  // Authorization check: Patient can view their own, Doctor/Admin can view
  if (requestingUser.role === 'PATIENT' && requestingUser.id !== patientId) {
    throw new Error('Access Forbidden: You can only access your own medical records.');
  }

  const whereClause = {
    patientId,
    ...(recordTypeFilter ? { recordType: recordTypeFilter } : {}),
  };

  const records = await prisma.patientHistory.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      hospital: { select: { id: true, name: true, city: true } },
      doctor: {
        include: {
          user: { select: { name: true } },
        },
      },
      creator: { select: { id: true, name: true, role: true } },
    },
  });

  return records.map((record) => ({
    id: record.id,
    patientId: record.patientId,
    recordType: record.recordType,
    clinicalData: decrypt(record.encryptedData),
    metadata: parseDbJson(record.metadataJson),
    hospital: record.hospital,
    doctor: record.doctor ? {
      id: record.doctor.id,
      name: record.doctor.user.name,
      specialty: record.doctor.specialty,
    } : null,
    creator: record.creator,
    createdAt: record.createdAt,
  }));
};

export const getRecordById = async ({ recordId, requestingUser }) => {
  const record = await prisma.patientHistory.findUnique({
    where: { id: recordId },
    include: {
      hospital: { select: { id: true, name: true, city: true } },
      doctor: {
        include: {
          user: { select: { name: true } },
        },
      },
      creator: { select: { id: true, name: true, role: true } },
    },
  });

  if (!record) {
    throw new Error('Medical record not found');
  }

  if (requestingUser.role === 'PATIENT' && requestingUser.id !== record.patientId) {
    throw new Error('Access Forbidden: You can only access your own medical records.');
  }

  return {
    id: record.id,
    patientId: record.patientId,
    recordType: record.recordType,
    clinicalData: decrypt(record.encryptedData),
    metadata: parseDbJson(record.metadataJson),
    hospital: record.hospital,
    doctor: record.doctor ? {
      id: record.doctor.id,
      name: record.doctor.user.name,
      specialty: record.doctor.specialty,
    } : null,
    creator: record.creator,
    createdAt: record.createdAt,
  };
};

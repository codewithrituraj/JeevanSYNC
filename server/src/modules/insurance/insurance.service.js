import prisma from '../../config/prisma.js';

export const getProviders = async () => {
  return await prisma.insuranceProvider.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { hospitals: true },
      },
    },
  });
};

export const checkCoverage = async ({ hospitalId, providerId, isCashless }) => {
  const where = {
    ...(hospitalId ? { hospitalId } : {}),
    ...(providerId ? { insuranceProviderId: providerId } : {}),
    ...(isCashless !== undefined ? { isCashless } : {}),
  };

  return await prisma.hospitalInsurance.findMany({
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
        },
      },
      insuranceProvider: true,
    },
    orderBy: { hospital: { name: 'asc' } },
  });
};

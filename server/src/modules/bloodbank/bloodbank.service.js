import prisma from '../../config/prisma.js';

export const getBloodAvailability = async ({ bloodGroup, city, minUnits = 0 }) => {
  const where = {
    unitsAvailable: { gte: minUnits },
    ...(bloodGroup ? { bloodGroup } : {}),
    ...(city ? { hospital: { city: { contains: city } } } : {}),
  };

  return await prisma.bloodInventory.findMany({
    where,
    include: {
      hospital: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          contactPhone: true,
          emergencyContact: true,
          latitude: true,
          longitude: true,
        },
      },
    },
    orderBy: [
      { bloodGroup: 'asc' },
      { unitsAvailable: 'desc' },
    ],
  });
};

export const getBloodSummaryByHospital = async (hospitalId) => {
  return await prisma.bloodInventory.findMany({
    where: { hospitalId },
    include: { hospital: true },
  });
};

export const updateBloodUnits = async ({ hospitalId, bloodGroup, unitsAvailable }) => {
  return await prisma.bloodInventory.upsert({
    where: {
      hospitalId_bloodGroup: {
        hospitalId,
        bloodGroup,
      },
    },
    update: {
      unitsAvailable,
      updatedAt: new Date(),
    },
    create: {
      hospitalId,
      bloodGroup,
      unitsAvailable,
    },
    include: {
      hospital: { select: { id: true, name: true, city: true } },
    },
  });
};

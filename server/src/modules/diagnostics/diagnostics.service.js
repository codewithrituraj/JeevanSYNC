import prisma from '../../config/prisma.js';

export const searchDiagnosticTests = async ({
  query,
  category,
  city,
  maxPrice,
  sortBy = 'price_asc',
}) => {
  const where = {
    available: true,
    ...(query ? { testName: { contains: query } } : {}),
    ...(category ? { category: { equals: category } } : {}),
    ...(maxPrice ? { price: { lte: maxPrice } } : {}),
    ...(city ? { hospital: { city: { contains: city } } } : {}),
  };

  let orderBy = { price: 'asc' };
  if (sortBy === 'price_desc') orderBy = { price: 'desc' };
  else if (sortBy === 'turnaround_asc') orderBy = { turnaroundHours: 'asc' };
  else if (sortBy === 'name_asc') orderBy = { testName: 'asc' };

  return await prisma.diagnosticTest.findMany({
    where,
    orderBy,
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
  });
};

export const getDiagnosticCategories = async () => {
  const tests = await prisma.diagnosticTest.findMany({
    select: { category: true },
    distinct: ['category'],
  });
  return tests.map((t) => t.category);
};

export const compareTestPrices = async (testName) => {
  return await prisma.diagnosticTest.findMany({
    where: {
      testName: { contains: testName },
      available: true,
    },
    include: {
      hospital: {
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          contactPhone: true,
        },
      },
    },
    orderBy: { price: 'asc' },
  });
};

export const createDiagnosticTest = async (data) => {
  return await prisma.diagnosticTest.create({
    data,
    include: {
      hospital: { select: { id: true, name: true, city: true } },
    },
  });
};

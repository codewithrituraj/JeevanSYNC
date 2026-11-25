import prisma from '../../config/prisma.js';

const toDbJson = (data) => {
  if (data === null || data === undefined) return null;
  return typeof data === 'string' ? data : JSON.stringify(data);
};

const parseDbJson = (data) => {
  if (!data) return [];
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const searchMedicines = async ({ query, hospitalId, inStockOnly = false }) => {
  const where = {
    ...(hospitalId ? { hospitalId } : {}),
    ...(inStockOnly ? { stockQty: { gt: 0 } } : {}),
    ...(query
      ? {
          OR: [
            { medicineName: { contains: query } },
            { genericName: { contains: query } },
          ],
        }
      : {}),
  };

  const medicines = await prisma.medicineInventory.findMany({
    where,
    include: {
      hospital: {
        select: { id: true, name: true, city: true, contactPhone: true },
      },
    },
    orderBy: { medicineName: 'asc' },
  });

  return medicines.map((m) => {
    const alternatives = parseDbJson(m.alternativesJson);
    return {
      ...m,
      alternatives,
      isOutOfStock: m.stockQty <= 0,
      suggestedAlternatives: m.stockQty <= 0 ? alternatives : [],
    };
  });
};

export const getMedicineById = async (id) => {
  const medicine = await prisma.medicineInventory.findUnique({
    where: { id },
    include: { hospital: true },
  });

  if (!medicine) return null;

  const alternatives = parseDbJson(medicine.alternativesJson);
  return {
    ...medicine,
    alternatives,
    isOutOfStock: medicine.stockQty <= 0,
    suggestedAlternatives: alternatives,
  };
};

export const createMedicine = async (data) => {
  const { alternatives, ...rest } = data;

  return await prisma.medicineInventory.create({
    data: {
      ...rest,
      alternativesJson: toDbJson(alternatives || []),
    },
    include: {
      hospital: { select: { id: true, name: true } },
    },
  });
};

export const updateStock = async (id, stockQty) => {
  return await prisma.medicineInventory.update({
    where: { id },
    data: {
      stockQty,
      updatedAt: new Date(),
    },
  });
};

export const asArray = (value) => (Array.isArray(value) ? value : []);

export const uniqueById = (records) => {
  const seen = new Set();
  return asArray(records).filter((record) => {
    const id = record?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export const toNumber = (value, fallback = null) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const formatNumber = (value, fallback = '—') => {
  const number = toNumber(value);
  return number === null ? fallback : new Intl.NumberFormat('en-IN').format(number);
};

export const formatCurrency = (value, fallback = '—') => {
  const number = toNumber(value);
  return number === null
    ? fallback
    : `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(number)}`;
};

export const formatDate = (value, fallback = 'Updated recently') => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? fallback
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatRelativeTime = (value, fallback = 'Updated recently') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Updated ${hours} hr ago`;
  return `Updated ${Math.round(hours / 24)} days ago`;
};

export const joinParts = (...parts) => parts.filter((part) => String(part || '').trim()).join(', ');

export const hospitalLabel = (hospital) => joinParts(hospital?.name, hospital?.city) || 'Hospital details unavailable';

export const formatBloodGroup = (group = '') => String(group).replace('_POS', '+').replace('_NEG', '-');

export const bedStatus = (occupancy) => {
  const value = toNumber(occupancy, 0);
  if (value > 90) return { label: 'Full', tone: 'danger' };
  if (value >= 70) return { label: 'Limited', tone: 'warning' };
  return { label: 'Available', tone: 'success' };
};

export const normalizeHospital = (hospital) => {
  if (!hospital?.id || !hospital?.name) return null;
  return { ...hospital, city: hospital.city || '', availableBeds: asArray(hospital.bedAvailability).reduce((sum, bed) => sum + Math.max(0, toNumber(bed.totalBeds, 0) - toNumber(bed.occupiedBeds, 0)), 0) };
};

export const normalizeBed = (bed) => {
  if (!bed?.id || !bed?.hospital?.id || !bed?.hospital?.name || !bed?.wardType) return null;
  const totalBeds = toNumber(bed.totalBeds, 0);
  const occupiedBeds = Math.min(totalBeds, Math.max(0, toNumber(bed.occupiedBeds, 0)));
  const availableBeds = Math.max(0, toNumber(bed.availableBeds, totalBeds - occupiedBeds));
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  return { ...bed, totalBeds, occupiedBeds, availableBeds, occupancyRate };
};

export const normalizeBlood = (item) => (
  item?.id && item?.bloodGroup && item?.hospital?.id && item?.hospital?.name
    ? { ...item, unitsAvailable: Math.max(0, toNumber(item.unitsAvailable, 0)) }
    : null
);

export const normalizeDiagnostic = (test) => (
  test?.id && test?.testName && test?.hospital?.id && test?.hospital?.name
    ? { ...test, price: toNumber(test.price), turnaroundHours: toNumber(test.turnaroundHours) }
    : null
);

export const normalizeDoctor = (doctor) => {
  if (!doctor?.id) return null;
  const user = doctor.user || (doctor.name ? { name: doctor.name } : null);
  const hospital = doctor.hospital || (
    doctor.hospitalId && doctor.hospitalName
      ? { id: doctor.hospitalId, name: doctor.hospitalName, city: doctor.city || '' }
      : null
  );
  if (!user?.name || !hospital?.id || !hospital?.name) return null;
  return {
    ...doctor,
    user,
    hospital,
    experienceYears: toNumber(doctor.experienceYears, 0),
    consultationFee: toNumber(doctor.consultationFee),
  };
};

export const cleanRecords = (records, normalizer) => uniqueById(asArray(records).map(normalizer).filter(Boolean));

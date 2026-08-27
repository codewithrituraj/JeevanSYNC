import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';
import { encrypt } from '../src/utils/crypto.js';

const toDbJson = (data) => {
  if (data === null || data === undefined) return null;
  return typeof data === 'string' ? data : JSON.stringify(data);
};

async function main() {
  console.log('🌱 Starting JeevanSYNC Database Seeding...');

  // 1. Clean existing records if any
  try {
    await prisma.auditLog.deleteMany();
    await prisma.reminder.deleteMany();
    await prisma.patientHistory.deleteMany();
    await prisma.referral.deleteMany();
    await prisma.ambulanceRequest.deleteMany();
    await prisma.bedAvailability.deleteMany();
    await prisma.bloodInventory.deleteMany();
    await prisma.diagnosticTest.deleteMany();
    await prisma.medicineInventory.deleteMany();
    await prisma.hospitalInsurance.deleteMany();
    await prisma.insuranceProvider.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.monikaConversation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.hospital.deleteMany();
  } catch (err) {
    console.log('Note: Clean step skipped or table empty:', err.message);
  }

  // 2. Seed Hospitals
  console.log('Seeding Hospitals...');
  const aiims = await prisma.hospital.create({
    data: {
      name: 'AIIMS Apex Healthcare',
      address: 'Ansari Nagar East, Ring Road',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110029',
      latitude: 28.5672,
      longitude: 77.2100,
      contactPhone: '+91-11-26588500',
      emergencyContact: '+91-11-26588700',
      isVerified: true,
    },
  });

  const maxHospital = await prisma.hospital.create({
    data: {
      name: 'Max Super Speciality Hospital',
      address: '1, 2, Press Enclave Marg, Saket',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110017',
      latitude: 28.5284,
      longitude: 77.2125,
      contactPhone: '+91-11-26515050',
      emergencyContact: '+91-11-26515151',
      isVerified: true,
    },
  });

  const fortisHospital = await prisma.hospital.create({
    data: {
      name: 'Fortis Memorial Research Institute',
      address: 'Sector 44, Opposite HUDA City Centre',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      latitude: 28.4595,
      longitude: 77.0725,
      contactPhone: '+91-124-4962200',
      emergencyContact: '+91-124-4962222',
      isVerified: true,
    },
  });

  // 3. Seed Users (Super Admin, Hospital Admins, Receptionists, Doctors, Patients)
  console.log('Seeding Users & Staff...');
  const passwordHash = await bcrypt.hash('Password@123', 10);

  // Super Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Verma (Super Admin)',
      phone: '9876543210',
      email: 'admin@jeevansync.org',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  // Hospital Admin Saket
  const maxAdmin = await prisma.user.create({
    data: {
      name: 'Vikram Malhotra',
      phone: '9876543211',
      email: 'admin.saket@maxhealthcare.com',
      passwordHash,
      role: 'HOSPITAL_ADMIN',
      hospitalId: maxHospital.id,
    },
  });

  // Reception Staff
  const receptionStaff = await prisma.user.create({
    data: {
      name: 'Pooja Sharma',
      phone: '9876543212',
      email: 'reception@maxhealthcare.com',
      passwordHash,
      role: 'RECEPTION_STAFF',
      hospitalId: maxHospital.id,
    },
  });

  // Doctors
  const doc1User = await prisma.user.create({
    data: {
      name: 'Dr. Ananya Sen',
      phone: '9876543213',
      email: 'dr.ananya@maxhealthcare.com',
      passwordHash,
      role: 'DOCTOR',
      hospitalId: maxHospital.id,
    },
  });

  const doc1 = await prisma.doctor.create({
    data: {
      userId: doc1User.id,
      hospitalId: maxHospital.id,
      specialty: 'Cardiology',
      qualification: 'MD, DM (Cardiology), FACC',
      experienceYears: 14,
      consultationFee: 1200.0,
      scheduleJson: toDbJson({
        monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        thursday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        friday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        saturday: ['10:00', '11:00', '12:00'],
      }),
    },
  });

  const doc2User = await prisma.user.create({
    data: {
      name: 'Dr. Sameer Kulkarni',
      phone: '9876543214',
      email: 'dr.sameer@aiims.edu',
      passwordHash,
      role: 'DOCTOR',
      hospitalId: aiims.id,
    },
  });

  const doc2 = await prisma.doctor.create({
    data: {
      userId: doc2User.id,
      hospitalId: aiims.id,
      specialty: 'Neurology',
      qualification: 'MBBS, MD, DM (Neurology)',
      experienceYears: 18,
      consultationFee: 800.0,
      scheduleJson: toDbJson({
        monday: ['10:00', '11:00', '12:00', '15:00'],
        wednesday: ['10:00', '11:00', '12:00', '15:00'],
        friday: ['10:00', '11:00', '12:00', '15:00'],
      }),
    },
  });

  const doc3User = await prisma.user.create({
    data: {
      name: 'Dr. Neha Agarwal',
      phone: '9876543215',
      email: 'dr.neha@fortis.com',
      passwordHash,
      role: 'DOCTOR',
      hospitalId: fortisHospital.id,
    },
  });

  const doc3 = await prisma.doctor.create({
    data: {
      userId: doc3User.id,
      hospitalId: fortisHospital.id,
      specialty: 'General Medicine',
      qualification: 'MBBS, MD (Internal Medicine)',
      experienceYears: 9,
      consultationFee: 700.0,
      scheduleJson: toDbJson({
        monday: ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00'],
        tuesday: ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00'],
        wednesday: ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00'],
        thursday: ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00'],
        friday: ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00'],
      }),
    },
  });

  // Patients
  const patient1 = await prisma.user.create({
    data: {
      name: 'Rohan Mehra',
      phone: '9811223344',
      email: 'rohan.mehra@gmail.com',
      passwordHash,
      role: 'PATIENT',
    },
  });

  const patient2 = await prisma.user.create({
    data: {
      name: 'Sunita Devi',
      phone: '9822334455',
      email: 'sunita.devi@outlook.com',
      passwordHash,
      role: 'PATIENT',
    },
  });

  // 4. Seed Blood Inventory
  console.log('Seeding Blood Inventory...');
  const bloodGroups = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'];
  
  for (const hospital of [aiims, maxHospital, fortisHospital]) {
    for (const group of bloodGroups) {
      await prisma.bloodInventory.create({
        data: {
          hospitalId: hospital.id,
          bloodGroup: group,
          unitsAvailable: Math.floor(Math.random() * 25) + 3,
        },
      });
    }
  }

  // 5. Seed Bed Availability
  console.log('Seeding Bed Availability...');
  const wardConfigs = [
    { wardType: 'ICU', totalBeds: 25, occupiedBeds: 19 },
    { wardType: 'HDU', totalBeds: 30, occupiedBeds: 22 },
    { wardType: 'EMERGENCY', totalBeds: 20, occupiedBeds: 14 },
    { wardType: 'GENERAL', totalBeds: 120, occupiedBeds: 85 },
    { wardType: 'PEDIATRIC', totalBeds: 40, occupiedBeds: 25 },
    { wardType: 'NICU', totalBeds: 15, occupiedBeds: 11 },
  ];

  for (const hospital of [aiims, maxHospital, fortisHospital]) {
    for (const ward of wardConfigs) {
      await prisma.bedAvailability.create({
        data: {
          hospitalId: hospital.id,
          wardType: ward.wardType,
          totalBeds: ward.totalBeds,
          occupiedBeds: Math.min(ward.occupiedBeds + Math.floor(Math.random() * 4) - 2, ward.totalBeds),
        },
      });
    }
  }

  // 6. Seed Diagnostic Tests
  console.log('Seeding Diagnostic Tests...');
  const testCatalog = [
    { testName: 'Complete Blood Count (CBC)', category: 'Pathology', price: 350, turnaroundHours: 6, sampleType: 'Blood', prerequisites: 'None' },
    { testName: 'Lipid Profile (Cholesterol Panel)', category: 'Biochemistry', price: 750, turnaroundHours: 12, sampleType: 'Blood', prerequisites: '12-hour overnight fasting required' },
    { testName: 'HbA1c (Glycated Hemoglobin)', category: 'Biochemistry', price: 500, turnaroundHours: 8, sampleType: 'Blood', prerequisites: 'None' },
    { testName: 'Liver Function Test (LFT)', category: 'Biochemistry', price: 800, turnaroundHours: 12, sampleType: 'Blood', prerequisites: '8-hour fasting recommended' },
    { testName: 'Kidney Function Test (KFT/RFT)', category: 'Biochemistry', price: 700, turnaroundHours: 12, sampleType: 'Blood', prerequisites: 'Drink plenty of water' },
    { testName: 'Thyroid Profile Total (T3, T4, TSH)', category: 'Endocrinology', price: 650, turnaroundHours: 24, sampleType: 'Blood', prerequisites: 'Early morning sample before medication' },
    { testName: 'Chest X-Ray (PA View)', category: 'Radiology', price: 450, turnaroundHours: 2, sampleType: 'Imaging', prerequisites: 'Remove metallic objects' },
    { testName: 'MRI Brain (Plain + Contrast)', category: 'Radiology', price: 6500, turnaroundHours: 24, sampleType: 'Imaging', prerequisites: 'No pacemakers/metal implants' },
    { testName: 'CT Scan Whole Abdomen', category: 'Radiology', price: 4200, turnaroundHours: 18, sampleType: 'Imaging', prerequisites: '6-hour fasting before scan' },
    { testName: 'Electrocardiogram (ECG)', category: 'Cardiology', price: 300, turnaroundHours: 1, sampleType: 'Cardio Test', prerequisites: 'Rest 10 minutes prior' },
  ];

  for (const hospital of [aiims, maxHospital, fortisHospital]) {
    for (const test of testCatalog) {
      const priceVariation = hospital.id === aiims.id ? test.price * 0.4 : test.price;
      await prisma.diagnosticTest.create({
        data: {
          hospitalId: hospital.id,
          testName: test.testName,
          category: test.category,
          price: Math.round(priceVariation),
          turnaroundHours: test.turnaroundHours,
          sampleType: test.sampleType,
          prerequisites: test.prerequisites,
          available: true,
        },
      });
    }
  }

  // 7. Seed Medicine Inventory & Alternatives
  console.log('Seeding Medicine Inventory...');
  const medicines = [
    {
      medicineName: 'Augmentin 625 Duo',
      genericName: 'Amoxicillin + Clavulanic Acid',
      dosageForm: 'Tablet',
      strength: '625mg',
      stockQty: 45,
      price: 210.0,
      alternativesJson: [
        { name: 'Moxikind-CV 625', generic: 'Amoxicillin + Clavulanic Acid', manufacturer: 'Mankind Pharma', price: 145.0, inStock: true },
        { name: 'Clavam 625', generic: 'Amoxicillin + Clavulanic Acid', manufacturer: 'Alkem Laboratories', price: 180.0, inStock: true },
        { name: 'Novamox-CV 625', generic: 'Amoxicillin + Clavulanic Acid', manufacturer: 'Cipla Ltd', price: 165.0, inStock: true },
      ],
    },
    {
      medicineName: 'Pan 40',
      genericName: 'Pantoprazole',
      dosageForm: 'Tablet',
      strength: '40mg',
      stockQty: 120,
      price: 155.0,
      alternativesJson: [
        { name: 'Pantocid 40', generic: 'Pantoprazole', manufacturer: 'Sun Pharma', price: 140.0, inStock: true },
        { name: 'Pantodac 40', generic: 'Pantoprazole', manufacturer: 'Zydus Cadila', price: 135.0, inStock: true },
        { name: 'Nolpaza 40', generic: 'Pantoprazole', manufacturer: 'Torrent Pharma', price: 120.0, inStock: true },
      ],
    },
    {
      medicineName: 'Dolo 650',
      genericName: 'Paracetamol',
      dosageForm: 'Tablet',
      strength: '650mg',
      stockQty: 0, // Out of stock to test alternative suggestion
      price: 32.0,
      alternativesJson: [
        { name: 'Calpol 650', generic: 'Paracetamol', manufacturer: 'GSK', price: 31.5, inStock: true },
        { name: 'Crocin 650 Advance', generic: 'Paracetamol', manufacturer: 'Haleon', price: 34.0, inStock: true },
        { name: 'Pacimol 650', generic: 'Paracetamol', manufacturer: 'Ipca Labs', price: 28.0, inStock: true },
      ],
    },
    {
      medicineName: 'Glycomet-GP 2/500',
      genericName: 'Glimepiride + Metformin',
      dosageForm: 'Tablet',
      strength: '2mg + 500mg',
      stockQty: 85,
      price: 180.0,
      alternativesJson: [
        { name: 'Gemer 2', generic: 'Glimepiride + Metformin', manufacturer: 'Sun Pharma', price: 165.0, inStock: true },
        { name: 'Zoryl-M 2', generic: 'Glimepiride + Metformin', manufacturer: 'Intas Pharma', price: 170.0, inStock: true },
      ],
    },
    {
      medicineName: 'Telma 40',
      genericName: 'Telmisartan',
      dosageForm: 'Tablet',
      strength: '40mg',
      stockQty: 90,
      price: 145.0,
      alternativesJson: [
        { name: 'Telmikind 40', generic: 'Telmisartan', manufacturer: 'Mankind Pharma', price: 95.0, inStock: true },
        { name: 'Telpres 40', generic: 'Telmisartan', manufacturer: 'Abbott', price: 135.0, inStock: true },
      ],
    },
  ];

  for (const hospital of [maxHospital, aiims, fortisHospital]) {
    for (const med of medicines) {
      await prisma.medicineInventory.create({
        data: {
          hospitalId: hospital.id,
          medicineName: med.medicineName,
          genericName: med.genericName,
          dosageForm: med.dosageForm,
          strength: med.strength,
          stockQty: med.stockQty,
          price: med.price,
          alternativesJson: toDbJson(med.alternativesJson),
        },
      });
    }
  }

  // 8. Seed Insurance Providers & Mappings
  console.log('Seeding Insurance Providers...');
  const starHealth = await prisma.insuranceProvider.create({
    data: {
      name: 'Star Health and Allied Insurance',
      code: 'STAR_HEALTH',
      contactPhone: '1800-425-2255',
      claimPortalUrl: 'https://www.starhealth.in/claims',
    },
  });

  const hdfcErgo = await prisma.insuranceProvider.create({
    data: {
      name: 'HDFC ERGO Health Insurance',
      code: 'HDFC_ERGO',
      contactPhone: '1800-2666',
      claimPortalUrl: 'https://www.hdfcergo.com/claims',
    },
  });

  const careInsurance = await prisma.insuranceProvider.create({
    data: {
      name: 'Care Health Insurance',
      code: 'CARE_HEALTH',
      contactPhone: '1800-102-4444',
      claimPortalUrl: 'https://www.careinsurance.com/claims',
    },
  });

  const iciciLombard = await prisma.insuranceProvider.create({
    data: {
      name: 'ICICI Lombard General Insurance',
      code: 'ICICI_LOMBARD',
      contactPhone: '1800-2666',
      claimPortalUrl: 'https://www.icicilombard.com',
    },
  });

  for (const hospital of [aiims, maxHospital, fortisHospital]) {
    for (const provider of [starHealth, hdfcErgo, careInsurance, iciciLombard]) {
      await prisma.hospitalInsurance.create({
        data: {
          hospitalId: hospital.id,
          insuranceProviderId: provider.id,
          isCashless: true,
          coverageDetails: 'Covers Inpatient (IPD), Critical Care, Dialysis, and Day Care Surgeries with pre-authorization.',
        },
      });
    }
  }

  // 9. Seed Appointments
  console.log('Seeding Appointments...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doc1.id,
      hospitalId: maxHospital.id,
      slotTime: tomorrow,
      status: 'CONFIRMED',
      notes: 'Routine hypertension follow-up and ECG review.',
      source: 'WEB',
    },
  });

  // 10. Seed Patient History (with AES-256 encrypted clinical notes)
  console.log('Seeding Encrypted Patient Medical History...');
  const encryptedConsultation = encrypt({
    symptoms: 'Mild chest tightness on exertion for 3 days, occasional palpitations.',
    diagnosis: 'Stage 1 Essential Hypertension with mild sinus tachycardia.',
    clinicalNotes: 'BP recorded at 145/92 mmHg. Pulse 88 bpm. Heart sounds normal (S1, S2 audible, no murmurs). Advised ECG and Lipid Profile.',
    prescriptions: [
      { medicine: 'Telma 40', dosage: '1 tablet once daily morning after breakfast', duration: '30 days' },
      { medicine: 'Dolo 650', dosage: 'SOS for tension headaches', duration: 'As needed' },
    ],
    precautions: 'Reduce dietary salt intake. Moderate 30-min walking. Avoid strenuous weight lifting until follow-up.',
  });

  await prisma.patientHistory.create({
    data: {
      patientId: patient1.id,
      hospitalId: maxHospital.id,
      doctorId: doc1.id,
      recordType: 'CONSULTATION',
      encryptedData: encryptedConsultation,
      metadataJson: toDbJson({
        visitDate: new Date().toISOString().split('T')[0],
        department: 'Cardiology',
        hospitalName: 'Max Super Speciality Hospital',
        doctorName: 'Dr. Ananya Sen',
      }),
      createdBy: doc1User.id,
    },
  });

  // 11. Seed Reminders
  console.log('Seeding Patient Reminders...');
  const medReminderTime = new Date();
  medReminderTime.setHours(8, 30, 0, 0);

  await prisma.reminder.create({
    data: {
      patientId: patient1.id,
      type: 'MEDICATION',
      title: 'Morning Blood Pressure Medication',
      message: 'Take 1 tablet of Telma 40 after breakfast with a glass of water.',
      scheduledAt: medReminderTime,
      status: 'PENDING',
      channel: 'IN_APP',
    },
  });

  await prisma.reminder.create({
    data: {
      patientId: patient1.id,
      type: 'APPOINTMENT',
      title: 'Upcoming Cardiology Follow-up',
      message: 'Appointment with Dr. Ananya Sen tomorrow at 10:00 AM at Max Hospital Saket.',
      scheduledAt: tomorrow,
      status: 'PENDING',
      channel: 'WHATSAPP',
    },
  });

  // 12. Seed Ambulance Requests
  console.log('Seeding Ambulance Requests...');
  await prisma.ambulanceRequest.create({
    data: {
      patientId: patient2.id,
      patientName: 'Sunita Devi',
      patientPhone: '9822334455',
      pickupLatitude: 28.5355,
      pickupLongitude: 77.2090,
      pickupAddress: 'B-42, Hauz Khas Enclave, New Delhi',
      hospitalId: maxHospital.id,
      urgencyLevel: 'CRITICAL',
      status: 'DISPATCHED',
      notes: 'Patient experiencing severe shortness of breath and diaphoresis.',
      dispatchedAt: new Date(),
    },
  });

  // 13. Seed Referrals
  console.log('Seeding Referrals...');
  await prisma.referral.create({
    data: {
      patientId: patient1.id,
      fromHospitalId: maxHospital.id,
      toHospitalId: aiims.id,
      reason: 'Advanced electrophysiology study and tertiary cardiac MRI consultation.',
      recordSnapshotJson: toDbJson({
        initialDiagnosis: 'Suspected arrhythmia with mild hypertensive heart disease',
        referringPhysician: 'Dr. Ananya Sen (Cardiology)',
        referralDate: new Date().toISOString().split('T')[0],
      }),
      status: 'PENDING',
    },
  });

  console.log('✅ JeevanSYNC Database Seeding Complete!');
  console.log('Demo Accounts:');
  console.log('  Super Admin:      phone 9876543210 / Password@123');
  console.log('  Hospital Admin:   phone 9876543211 / Password@123');
  console.log('  Reception Staff:  phone 9876543212 / Password@123');
  console.log('  Doctor (Cardio):  phone 9876543213 / Password@123');
  console.log('  Patient (Rohan):  phone 9811223344 / Password@123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../config/prisma.js';
import { ENV } from '../../config/env.js';

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    role: user.role,
    phone: user.phone,
    name: user.name,
    hospitalId: user.hospitalId || null,
  };

  const accessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRES_IN,
  });

  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ENV.JWT_REFRESH_EXPIRES_DAYS);

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    tokenHash,
    expiresAt,
  };
};

export const registerUser = async (data) => {
  const { name, phone, email, password, role = 'PATIENT', hospitalId, specialty, qualification, experienceYears, consultationFee } = data;

  // Check if phone or email already registered
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone },
        ...(email ? [{ email }] : [])
      ]
    }
  });

  if (existingUser) {
    throw new Error('A user with this phone number or email already exists.');
  }

  const passwordHash = await hashPassword(password);

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        phone,
        email: email || null,
        passwordHash,
        role,
        hospitalId: hospitalId || null,
      },
    });

    if (role === 'DOCTOR') {
      if (!hospitalId) {
        throw new Error('Doctors must be assigned to a hospital.');
      }
      await tx.doctor.create({
        data: {
          userId: user.id,
          hospitalId,
          specialty: specialty || 'General Medicine',
          qualification: qualification || 'MBBS',
          experienceYears: experienceYears || 0,
          consultationFee: consultationFee || 500.0,
        },
      });
    }

    return user;
  });

  const tokens = generateTokens(newUser);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      tokenHash: tokens.tokenHash,
      userId: newUser.id,
      expiresAt: tokens.expiresAt,
    },
  });

  return {
    user: {
      id: newUser.id,
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email,
      role: newUser.role,
      hospitalId: newUser.hospitalId,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const loginUser = async ({ identifier, password }) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: identifier },
        { email: identifier }
      ]
    },
    include: {
      hospital: {
        select: { id: true, name: true, city: true }
      },
      doctorProfile: true,
    }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const tokens = generateTokens(user);

  // Save new refresh token in DB
  await prisma.refreshToken.create({
    data: {
      tokenHash: tokens.tokenHash,
      userId: user.id,
      expiresAt: tokens.expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
      hospital: user.hospital,
      doctorProfile: user.doctorProfile,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const rotateRefreshToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    throw new Error('Refresh token is required');
  }

  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.revoked || new Date() > tokenRecord.expiresAt) {
    throw new Error('Invalid or expired refresh token');
  }

  // Revoke used refresh token (token rotation security)
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { revoked: true },
  });

  // Issue brand new token pair
  const tokens = generateTokens(tokenRecord.user);

  await prisma.refreshToken.create({
    data: {
      tokenHash: tokens.tokenHash,
      userId: tokenRecord.user.id,
      expiresAt: tokens.expiresAt,
    },
  });

  return {
    user: {
      id: tokenRecord.user.id,
      name: tokenRecord.user.name,
      phone: tokenRecord.user.phone,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
      hospitalId: tokenRecord.user.hospitalId,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const revokeAllUserTokens = async (userId) => {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
};

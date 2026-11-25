import * as authService from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logAudit } from '../../middleware/auditLogger.js';
import prisma from '../../config/prisma.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.validated.body);
    
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    
    await logAudit({
      userId: result.user.id,
      action: 'USER_REGISTER',
      resource: 'users',
      resourceId: result.user.id,
      req,
      details: { role: result.user.role },
    });

    return sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 201, 'User registered successfully');
  } catch (error) {
    return sendError(res, error.message, 400, null, 'REGISTRATION_FAILED');
  }
};

export const login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.validated.body);
    
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    await logAudit({
      userId: result.user.id,
      action: 'USER_LOGIN',
      resource: 'users',
      resourceId: result.user.id,
      req,
      details: { role: result.user.role },
    });

    return sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 200, 'Login successful');
  } catch (error) {
    return sendError(res, error.message, 401, null, 'INVALID_CREDENTIALS');
  }
};

export const refresh = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
    if (!rawRefreshToken) {
      return sendError(res, 'Refresh token required', 401, null, 'REFRESH_TOKEN_MISSING');
    }

    const result = await authService.rotateRefreshToken(rawRefreshToken);
    
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    return sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 200, 'Token refreshed successfully');
  } catch (error) {
    return sendError(res, error.message, 401, null, 'REFRESH_FAILED');
  }
};

export const logout = async (req, res) => {
  try {
    if (req.user) {
      await authService.revokeAllUserTokens(req.user.id);
      await logAudit({
        userId: req.user.id,
        action: 'USER_LOGOUT',
        resource: 'users',
        resourceId: req.user.id,
        req,
      });
    }
    res.clearCookie('refreshToken');
    return sendSuccess(res, null, 200, 'Logged out successfully');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        hospitalId: true,
        createdAt: true,
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            contactPhone: true,
            emergencyContact: true,
          }
        },
        doctorProfile: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', 404, null, 'USER_NOT_FOUND');
    }

    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { sendError } from '../utils/response.js';
import prisma from '../config/prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header (Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return sendError(res, 'Authentication required. No token provided.', 401, null, 'AUTH_REQUIRED');
    }

    const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET);
    
    // Fetch minimal user context
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        hospitalId: true,
      },
    });

    if (!user) {
      return sendError(res, 'User session invalid or user deleted.', 401, null, 'USER_NOT_FOUND');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Access token has expired. Please refresh token.', 401, null, 'TOKEN_EXPIRED');
    }
    return sendError(res, 'Invalid authentication token.', 401, null, 'INVALID_TOKEN');
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          role: true,
          hospitalId: true,
        },
      });
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Ignore error for optional authentication
  }
  next();
};

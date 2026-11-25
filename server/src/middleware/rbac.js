import { sendError } from '../utils/response.js';

/**
 * Role-Based Access Control (RBAC)
 * Enforces explicit role permissions. Default-deny.
 *
 * @param  {...string} allowedRoles - List of allowed roles (e.g. 'DOCTOR', 'HOSPITAL_ADMIN')
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized. Please login.', 401, null, 'UNAUTHORIZED');
    }

    const userRole = req.user.role;

    // Super Admin has universal access
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return sendError(
        res,
        `Access Forbidden. Required role(s): [${allowedRoles.join(', ')}]. Your role: ${userRole}`,
        403,
        null,
        'FORBIDDEN'
      );
    }

    next();
  };
};

/**
 * Ensures user is acting within their designated hospital or is super admin.
 */
export const requireHospitalAffiliation = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized.', 401, null, 'UNAUTHORIZED');
  }

  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  const hospitalId = req.params.hospitalId || req.body.hospitalId || req.query.hospitalId;

  if (!req.user.hospitalId || (hospitalId && req.user.hospitalId !== hospitalId)) {
    return sendError(
      res,
      'Access Denied: You cannot modify records for a hospital you do not belong to.',
      403,
      null,
      'HOSPITAL_MISMATCH'
    );
  }

  next();
};

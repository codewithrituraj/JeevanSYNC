import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Creates an immutable audit log entry for healthcare compliance.
 */
export const logAudit = async ({
  userId = null,
  action,
  resource,
  resourceId = null,
  req = null,
  details = null,
}) => {
  try {
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || 'unknown';
    const userAgent = req?.headers['user-agent'] || 'unknown';
    const activeUserId = userId || req?.user?.id || null;

    const toDbJson = (data) => {
      if (data === null || data === undefined) return null;
      return typeof data === 'string' ? data : JSON.stringify(data);
    };

    await prisma.auditLog.create({
      data: {
        userId: activeUserId,
        action,
        resource,
        resourceId,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.slice(0, 45) : 'unknown',
        userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 255) : 'unknown',
        details: toDbJson(details || {}),
      },
    });

    logger.info(`[AUDIT] Action: ${action} | Resource: ${resource}:${resourceId || 'N/A'} | User: ${activeUserId || 'ANONYMOUS'}`);
  } catch (error) {
    logger.error('Failed to write audit log entry:', { error: error.message, action, resource });
  }
};

/**
 * Middleware wrapper for automatic audit logging on route completion.
 */
export const auditMiddleware = (action, resource) => {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        logAudit({
          action,
          resource,
          resourceId: req.params.id || req.params.patientId || null,
          req,
          details: {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
          },
        });
      }
    });
    next();
  };
};

import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled Exception Caught:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  if (err.name === 'ZodError') {
    return sendError(res, 'Validation Error', 400, err.errors, 'VALIDATION_ERROR');
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, 'Invalid or expired token', 401, null, 'UNAUTHORIZED');
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  return sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};

/**
 * Standard API Response Envelope: { success: boolean, data: any, error: any }
 */

export const sendSuccess = (res, data = null, statusCode = 200, message = null) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    error: null,
  });
};

export const sendError = (res, message = 'Internal Server Error', statusCode = 500, details = null, code = 'INTERNAL_ERROR') => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message,
      code,
      details,
    },
  });
};

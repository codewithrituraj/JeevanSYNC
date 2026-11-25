import { sendError } from '../utils/response.js';

export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.validated = parsed;
      next();
    } catch (error) {
      const errors = error.errors?.map(err => ({
        field: err.path.join('.').replace(/^(body|query|params)\./, ''),
        message: err.message,
      })) || [{ message: error.message }];
      
      return sendError(res, 'Validation failed for input data', 400, errors, 'VALIDATION_FAILED');
    }
  };
};

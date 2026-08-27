import * as insuranceService from './insurance.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getProviders = async (req, res) => {
  try {
    const providers = await insuranceService.getProviders();
    return sendSuccess(res, providers);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const checkCoverage = async (req, res) => {
  try {
    const query = req.validated?.query || req.query || {};
    const coverage = await insuranceService.checkCoverage(query);
    return sendSuccess(res, coverage);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

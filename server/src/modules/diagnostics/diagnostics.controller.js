import * as diagnosticsService from './diagnostics.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const searchTests = async (req, res) => {
  try {
    const tests = await diagnosticsService.searchDiagnosticTests(req.query || {});
    return sendSuccess(res, tests);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await diagnosticsService.getDiagnosticCategories();
    return sendSuccess(res, categories);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const comparePrices = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return sendError(res, 'Test name is required for price comparison', 400);
    }
    const comparison = await diagnosticsService.compareTestPrices(name);
    return sendSuccess(res, comparison);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createTest = async (req, res) => {
  try {
    const test = await diagnosticsService.createDiagnosticTest(req.validated.body);

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_DIAGNOSTIC_TEST',
      resource: 'diagnostic_tests',
      resourceId: test.id,
      req,
      details: { testName: test.testName, price: test.price },
    });

    return sendSuccess(res, test, 201, 'Diagnostic test listed successfully');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

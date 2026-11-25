import * as inventoryService from './inventory.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const searchMedicines = async (req, res) => {
  try {
    const list = await inventoryService.searchMedicines(req.query || {});
    return sendSuccess(res, list);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const medicine = await inventoryService.getMedicineById(req.params.id);
    if (!medicine) {
      return sendError(res, 'Medicine not found', 404);
    }
    return sendSuccess(res, medicine);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createMedicine = async (req, res) => {
  try {
    const created = await inventoryService.createMedicine(req.validated.body);

    await logAudit({
      userId: req.user.id,
      action: 'ADD_MEDICINE_INVENTORY',
      resource: 'medicine_inventory',
      resourceId: created.id,
      req,
      details: { medicineName: created.medicineName, stockQty: created.stockQty },
    });

    return sendSuccess(res, created, 201, 'Medicine added to inventory');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const updateStock = async (req, res) => {
  try {
    const { stockQty } = req.body;
    if (stockQty === undefined || stockQty < 0) {
      return sendError(res, 'Valid stockQty is required', 400);
    }
    const updated = await inventoryService.updateStock(req.params.id, Number(stockQty));
    return sendSuccess(res, updated, 200, 'Stock level updated');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

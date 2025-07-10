import { asyncHandler } from "../middleware/errorHandler.js";
import * as stockService from "../services/index.js";

/**
 * Create a new stock entry
 * POST /api/stock/entries
 */
export const createStockEntry = asyncHandler(async (req, res) => {
  // Convert string IDs to integers for Prisma
  const entryData = {
    ...req.body,
    rawMaterialId: parseInt(req.body.rawMaterialId),
    receivedBy: parseInt(req.body.receivedById)
  };

  // Validate that the IDs are valid integers
  if (isNaN(entryData.rawMaterialId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid raw material ID"
    });
  }

  if (isNaN(entryData.receivedBy)) {
    return res.status(400).json({
      success: false,
      error: "Invalid receivedBy user ID"
    });
  }

  const result = await stockService.createStockEntry(entryData);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.status(201).json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Get all stock entries with optional filtering
 * GET /api/stock/entries
 */
export const getStockEntries = asyncHandler(async (req, res) => {
  const { rawMaterialId, supplier, fromDate, toDate } = req.query;

  const filters = {};
  if (rawMaterialId) filters.rawMaterialId = rawMaterialId;
  if (supplier) filters.supplier = supplier;
  if (fromDate) filters.fromDate = fromDate;
  if (toDate) filters.toDate = toDate;

  const result = await stockService.getAllStockEntries(filters);

  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Update stock entry
 * PUT /api/stock/entries/:id
 */
export const updateStockEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Convert string IDs to integers for Prisma
  const updateData = { ...req.body };

  if (updateData.rawMaterialId) {
    updateData.rawMaterialId = parseInt(updateData.rawMaterialId);
    if (isNaN(updateData.rawMaterialId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid raw material ID"
      });
    }
  }

  if (updateData.receivedBy) {
    updateData.receivedBy = parseInt(updateData.receivedBy);
    if (isNaN(updateData.receivedBy)) {
      return res.status(400).json({
        success: false,
        error: "Invalid receivedBy user ID"
      });
    }
  }

  const result = await stockService.updateStockEntry({ id: parseInt(id), ...updateData });

  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Delete stock entry
 * DELETE /api/stock/entries/:id
 */
export const deleteStockEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const entryId = parseInt(id);

  // Read force parameter from query string and convert to boolean
  const forceDelete = req.query.force === "true";

  if (isNaN(entryId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid stock entry ID"
    });
  }

  const result = await stockService.deleteStockEntry(entryId, forceDelete);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    message: result.message
  });
});

/**
 * Create stock movement
 * POST /api/stock/movements
 */
export const createStockMovement = asyncHandler(async (req, res) => {
  // Convert string IDs to integers for Prisma
  const movementData = {
    ...req.body,
    stockEntryId: parseInt(req.body.stockEntryId),
    performedBy: parseInt(req.body.performedBy)
  };

  // Convert optional section IDs
  if (req.body.fromSectionId) {
    movementData.fromSectionId = parseInt(req.body.fromSectionId);
    if (isNaN(movementData.fromSectionId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid fromSectionId"
      });
    }
  }

  if (req.body.toSectionId) {
    movementData.toSectionId = parseInt(req.body.toSectionId);
    if (isNaN(movementData.toSectionId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid toSectionId"
      });
    }
  }

  // Validate required IDs
  if (isNaN(movementData.stockEntryId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid stock entry ID"
    });
  }

  if (isNaN(movementData.performedBy)) {
    return res.status(400).json({
      success: false,
      error: "Invalid performedBy user ID"
    });
  }

  const result = await stockService.createStockMovement(movementData);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.status(201).json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Get stock movements with optional filtering
 * GET /api/stock/movements
 */
export const getStockMovements = asyncHandler(async (req, res) => {
  const { stockEntryId, type, fromDate, toDate, sectionId } = req.query;

  const filters = {};
  if (stockEntryId) filters.stockEntryId = stockEntryId;
  if (type) filters.type = type;
  if (fromDate) filters.fromDate = fromDate;
  if (toDate) filters.toDate = toDate;
  if (sectionId) filters.sectionId = sectionId;

  const result = await stockService.getStockMovements(filters);

  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Get current stock levels for all materials
 * GET /api/stock/levels
 */
export const getCurrentStockLevels = asyncHandler(async (req, res) => {
  const result = await stockService.getCurrentStockLevels();

  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Get stock level for specific material
 * GET /api/stock/levels/:rawMaterialId
 */
export const getStockLevel = asyncHandler(async (req, res) => {
  const { rawMaterialId } = req.params;
  const materialId = parseInt(rawMaterialId);

  if (isNaN(materialId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid raw material ID"
    });
  }

  const result = await stockService.getStockLevel(materialId);

  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Transfer stock between sections
 * POST /api/stock/transfer
 */
export const transferStock = asyncHandler(async (req, res) => {
  const { stockEntryId, fromSectionId, toSectionId, quantity, performedBy, reason } = req.body;

  // Convert string IDs to integers for Prisma
  const entryId = parseInt(stockEntryId);
  const fromSection = parseInt(fromSectionId);
  const toSection = parseInt(toSectionId);
  const user = parseInt(performedBy);

  // Validate IDs
  if (isNaN(entryId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid stock entry ID"
    });
  }

  if (isNaN(fromSection)) {
    return res.status(400).json({
      success: false,
      error: "Invalid fromSectionId"
    });
  }

  if (isNaN(toSection)) {
    return res.status(400).json({
      success: false,
      error: "Invalid toSectionId"
    });
  }

  if (isNaN(user)) {
    return res.status(400).json({
      success: false,
      error: "Invalid performedBy user ID"
    });
  }

  const result = await stockService.transferStock(entryId, fromSection, toSection, quantity, user, reason);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    message: result.message
  });
});

/**
 * Get comprehensive reports data
 * GET /api/stock/reports
 */
export const getReportsData = asyncHandler(async (req, res) => {
  const { dateRange = 30, sectionId } = req.query;
  const days = parseInt(dateRange);

  const result = await stockService.getReportsData(days, sectionId);

  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Get consumption report data
 * GET /api/stock/reports/consumption
 */
export const getConsumptionReport = asyncHandler(async (req, res) => {
  const { dateRange = 30, sectionId } = req.query;
  const days = parseInt(dateRange);

  const result = await stockService.getConsumptionReport(days, sectionId);

  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Get expense report data
 * GET /api/stock/reports/expenses
 */
export const getExpenseReport = asyncHandler(async (req, res) => {
  const { dateRange = 30 } = req.query;
  const days = parseInt(dateRange);

  const result = await stockService.getExpenseReport(days);

  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Get low stock report data
 * GET /api/stock/reports/low-stock
 */
export const getLowStockReport = asyncHandler(async (req, res) => {
  const result = await stockService.getLowStockReport();

  res.json({
    success: true,
    data: result.data
  });
});

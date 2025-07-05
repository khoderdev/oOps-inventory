import { asyncHandler } from "../middleware/errorHandler.js";
import * as supplierService from "../services/supplierService.js";

/**
 * Create a new supplier
 * POST /api/suppliers
 */
export const createSupplier = asyncHandler(async (req, res) => {
  const result = await supplierService.createSupplier(req.body);

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
 * Get all suppliers with filtering
 * GET /api/suppliers
 */
export const getSuppliers = asyncHandler(async (req, res) => {
  // Parse query parameters properly
  const filters = { ...req.query };

  // Convert is_active from string to boolean
  if (filters.is_active !== undefined) {
    filters.is_active = filters.is_active === "true";
  }

  // Convert page and limit to numbers
  if (filters.page) {
    filters.page = parseInt(filters.page);
  }
  if (filters.limit) {
    filters.limit = parseInt(filters.limit);
  }

  const result = await supplierService.getSuppliers(filters);

  if (!result.success) {
    return res.status(500).json({
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
 * Get supplier by ID
 * GET /api/suppliers/:id
 */
export const getSupplierById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await supplierService.getSuppliers({
    id: parseInt(id),
    limit: 1
  });

  if (!result.success || result.data.suppliers.length === 0) {
    return res.status(404).json({
      success: false,
      error: "Supplier not found"
    });
  }

  res.json({
    success: true,
    data: result.data.suppliers[0]
  });
});

/**
 * Update supplier
 * PUT /api/suppliers/:id
 */
export const updateSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await supplierService.updateSupplier(id, req.body);

  if (!result.success) {
    return res.status(400).json({
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
 * Get supplier performance metrics
 * GET /api/suppliers/:id/performance
 */
export const getSupplierPerformance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { days = 90 } = req.query;

  const result = await supplierService.getSupplierPerformance(id, parseInt(days));

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
 * Update supplier material pricing
 * POST /api/suppliers/materials
 */
export const updateSupplierMaterial = asyncHandler(async (req, res) => {
  const result = await supplierService.updateSupplierMaterial(req.body);

  if (!result.success) {
    return res.status(400).json({
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
 * Get supplier comparison for a material
 * GET /api/suppliers/compare/:materialId
 */
export const getSupplierComparison = asyncHandler(async (req, res) => {
  const { materialId } = req.params;

  const result = await supplierService.getSupplierComparison(materialId);

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
 * Get supplier analytics
 * GET /api/suppliers/analytics
 */
export const getSupplierAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const result = await supplierService.getSupplierAnalytics(parseInt(days));

  if (!result.success) {
    return res.status(500).json({
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
 * Delete supplier (soft delete)
 * DELETE /api/suppliers/:id
 */
export const deleteSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await supplierService.updateSupplier(id, { is_active: false });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    message: "Supplier deactivated successfully"
  });
});

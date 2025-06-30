import { asyncHandler } from "../middleware/errorHandler.js";
import * as rawMaterialService from "../services/rawMaterialService.js";

/**
 * Get all raw materials with optional filtering
 * GET /api/raw-materials
 */
export const getRawMaterials = asyncHandler(async (req, res) => {
  const { category, isActive, search } = req.query;
  const filters = { category, isActive: isActive === "true", search };

  const result = await rawMaterialService.getAllRawMaterials(filters);

  res.json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Get raw material by ID
 * GET /api/raw-materials/:id
 */
export const getRawMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await rawMaterialService.getRawMaterialById(id);

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
 * Create new raw material
 * POST /api/raw-materials
 */
export const createRawMaterial = asyncHandler(async (req, res) => {
  // TODO: Add validation schema
  // const validation = validateData(createRawMaterialSchema, req.body);
  // if (!validation.isValid) {
  //   return res.status(400).json({
  //     success: false,
  //     error: "Validation failed",
  //     details: validation.errors
  //   });
  // }

  const result = await rawMaterialService.createRawMaterial(req.body);

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
 * Update raw material
 * PUT /api/raw-materials/:id
 */
export const updateRawMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // TODO: Add validation schema
  // const validation = validateData(updateRawMaterialSchema, req.body);
  // if (!validation.isValid) {
  //   return res.status(400).json({
  //     success: false,
  //     error: "Validation failed",
  //     details: validation.errors
  //   });
  // }

  const result = await rawMaterialService.updateRawMaterial({ id, ...req.body });

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
 * Delete raw material
 * DELETE /api/raw-materials/:id
 */
export const deleteRawMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await rawMaterialService.deleteRawMaterial(id);

  if (!result.success) {
    return res.status(404).json({
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
 * Get low stock materials
 * GET /api/raw-materials/low-stock
 */
export const getLowStockMaterials = asyncHandler(async (req, res) => {
  const result = await rawMaterialService.getLowStockMaterials();

  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Get materials by category
 * GET /api/raw-materials/category/:category
 */
export const getMaterialsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  const result = await rawMaterialService.getMaterialsByCategory(category);

  res.json({
    success: true,
    data: result.data
  });
});

import { asyncHandler } from "../middleware/errorHandler.js";
import * as categoryService from "../services/index.js";

/**
 * Create a new category
 * POST /api/categories
 */
export const createCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.createCategory({
    ...req.body,
    created_by: req.user.id
  });

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
 * Get all categories with optional filtering
 * GET /api/categories
 */
export const getCategories = asyncHandler(async (req, res) => {
  const result = await categoryService.getCategories(req.query);

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
 * Get category by ID
 * GET /api/categories/:id
 */
export const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await categoryService.getCategoryById(parseInt(id, 10));

  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: "Category not found"
    });
  }

  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Update category
 * PUT /api/categories/:id
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await categoryService.updateCategory(parseInt(id, 10), req.body);

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
 * Delete category
 * DELETE /api/categories/:id
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await categoryService.deleteCategory(parseInt(id, 10));

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

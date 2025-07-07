import { asyncHandler } from "../middleware/errorHandler.js";
import * as recipeService from "../services/recipeService.js";

/**
 * Create a new recipe
 * POST /api/recipes
 */
export const createRecipe = asyncHandler(async (req, res) => {
  const result = await recipeService.createRecipe({
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
 * Get all recipes with filtering
 * GET /api/recipes
 */
export const getRecipes = asyncHandler(async (req, res) => {
  const result = await recipeService.getRecipes(req.query);

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
 * Get recipe by ID
 * GET /api/recipes/:id
 */
export const getRecipeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await recipeService.getRecipes({
    id: parseInt(id),
    limit: 1
  });

  if (!result.success || result.data.recipes.length === 0) {
    return res.status(404).json({
      success: false,
      error: "Recipe not found"
    });
  }

  res.json({
    success: true,
    data: result.data.recipes[0]
  });
});

/**
 * Calculate recipe cost
 * GET /api/recipes/:id/calculate-cost
 */
export const calculateRecipeCost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await recipeService.calculateRecipeCost(id);

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
 * Create menu item
 * POST /api/recipes/menu-items
 */
export const createMenuItem = asyncHandler(async (req, res) => {
  const result = await recipeService.createMenuItem(req.body);

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
 * Get menu engineering analysis
 * GET /api/recipes/menu-engineering
 */
export const getMenuEngineering = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const result = await recipeService.getMenuEngineering(parseInt(days));

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
 * Get recipe cost variance analysis
 * GET /api/recipes/:id/cost-variance
 */
export const getRecipeCostVariance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { days = 30 } = req.query;

  const result = await recipeService.getRecipeCostVariance(id, parseInt(days));

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
 * Update recipe
 * PUT /api/recipes/:id
 */
export const updateRecipe = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ingredients, ...recipeData } = req.body;

  // For now, we'll implement a basic update
  // In a full implementation, you'd want to handle ingredient updates properly

  res.json({
    success: true,
    message: "Recipe update functionality to be implemented"
  });
});

/**
 * Delete recipe (soft delete)
 * DELETE /api/recipes/:id
 */
export const deleteRecipe = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // For now, we'll implement a basic soft delete
  // In a full implementation, you'd update the is_active field

  res.json({
    success: true,
    message: "Recipe delete functionality to be implemented"
  });
});

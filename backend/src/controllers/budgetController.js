import { asyncHandler } from "../middleware/errorHandler.js";
import * as budgetService from "../services/index.js";

/**
 * Create a new budget
 * POST /api/budgets
 */
export const createBudget = asyncHandler(async (req, res) => {
  const result = await budgetService.createBudget({
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
 * Get all budgets with filtering
 * GET /api/budgets
 */
export const getBudgets = asyncHandler(async (req, res) => {
  const result = await budgetService.getBudgets(req.query);

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
 * Get budget by ID
 * GET /api/budgets/:id
 */
export const getBudgetById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await budgetService.getBudgets({
    id: parseInt(id),
    limit: 1
  });

  if (!result.success || result.data.budgets.length === 0) {
    return res.status(404).json({
      success: false,
      error: "Budget not found"
    });
  }

  res.json({
    success: true,
    data: result.data.budgets[0]
  });
});

/**
 * Calculate budget spending
 * GET /api/budgets/:id/spending
 */
export const calculateBudgetSpending = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await budgetService.calculateBudgetSpending(id);

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
 * Get budget variance analysis
 * GET /api/budgets/:id/variance
 */
export const getBudgetVarianceAnalysis = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await budgetService.getBudgetVarianceAnalysis(id);

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
 * Generate budget recommendations
 * GET /api/budgets/:id/recommendations
 */
export const generateBudgetRecommendations = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await budgetService.generateBudgetRecommendations(id);

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
 * Update budget
 * PUT /api/budgets/:id
 */
export const updateBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // For now, we'll implement a basic update placeholder
  // In a full implementation, you'd want to handle allocation updates properly

  res.json({
    success: true,
    message: "Budget update functionality to be implemented"
  });
});

/**
 * Delete budget (soft delete)
 * DELETE /api/budgets/:id
 */
export const deleteBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // For now, we'll implement a basic soft delete placeholder
  // In a full implementation, you'd update the is_active field

  res.json({
    success: true,
    message: "Budget delete functionality to be implemented"
  });
});

/**
 * Get budget dashboard analytics
 * GET /api/budgets/analytics
 */
export const getBudgetAnalytics = asyncHandler(async (req, res) => {
  // This would aggregate data across all budgets
  // For now, return a placeholder

  res.json({
    success: true,
    data: {
      totalBudgets: 0,
      activeBudgets: 0,
      totalAllocated: 0,
      totalSpent: 0,
      averageUtilization: 0
    }
  });
});

import express from "express";
import * as costControlController from "../controllers/costControlController.js";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/rbac.js";

const router = express.Router();

// All cost control routes require authentication and admin access
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/cost-control/dashboard
 * Get comprehensive cost control dashboard data
 * Query params: days (default: 30), category (optional)
 */
router.get("/dashboard", costControlController.getCostControlDashboard);

/**
 * GET /api/cost-control/analytics
 * Get detailed cost analytics
 * Query params: days (default: 30), category (optional)
 */
router.get("/analytics", costControlController.getCostAnalytics);

/**
 * GET /api/cost-control/suppliers
 * Get supplier cost comparison analysis
 * Query params: days (default: 30)
 */
router.get("/suppliers", costControlController.getSupplierAnalysis);

/**
 * GET /api/cost-control/recommendations
 * Get cost optimization recommendations
 */
router.get("/recommendations", costControlController.getOptimizationRecommendations);

/**
 * GET /api/cost-control/trends
 * Get cost trend analysis
 * Query params: days (default: 90)
 */
router.get("/trends", costControlController.getCostTrendAnalysis);

export default router;

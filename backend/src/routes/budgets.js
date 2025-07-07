import express from "express";
import * as budgetController from "../controllers/budgetController.js";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/rbac.js";

const router = express.Router();

// Middleware - all routes require authentication and admin access
router.use(authenticate);
router.use(requireAdmin);

// Budget CRUD routes
router.post("/", budgetController.createBudget);
router.get("/", budgetController.getBudgets);
router.get("/analytics", budgetController.getBudgetAnalytics);
router.get("/:id", budgetController.getBudgetById);
router.put("/:id", budgetController.updateBudget);
router.delete("/:id", budgetController.deleteBudget);

// Budget analysis routes
router.get("/:id/spending", budgetController.calculateBudgetSpending);
router.get("/:id/variance", budgetController.getBudgetVarianceAnalysis);
router.get("/:id/recommendations", budgetController.generateBudgetRecommendations);

export default router;

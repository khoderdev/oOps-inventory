import express from "express";
import * as recipeController from "../controllers/recipeController.js";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/rbac.js";

const router = express.Router();

// Middleware - all routes require authentication and admin access
router.use(authenticate);
router.use(requireAdmin);

// Recipe CRUD routes
router.post("/", recipeController.createRecipe);
router.get("/", recipeController.getRecipes);
router.get("/:id", recipeController.getRecipeById);
router.put("/:id", recipeController.updateRecipe);
router.delete("/:id", recipeController.deleteRecipe);

// Recipe analysis routes
router.get("/:id/calculate-cost", recipeController.calculateRecipeCost);
router.get("/:id/cost-variance", recipeController.getRecipeCostVariance);

// Menu engineering routes
router.get("/menu-engineering", recipeController.getMenuEngineering);
router.post("/menu-items", recipeController.createMenuItem);

export default router;

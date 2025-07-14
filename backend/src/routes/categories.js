import express from "express";
import * as categoryController from "../controllers/categoriesController.js";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/rbac.js";
const router = express.Router();

// Middleware - all routes require authentication and admin access
router.use(authenticate);
router.use(requireAdmin);

// Category CRUD routes
router.post("/", categoryController.createCategory);
router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategory);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

export default router;

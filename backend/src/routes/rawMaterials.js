import { Router } from "express";
import { createRawMaterial, deleteRawMaterial, getLowStockMaterials, getMaterialsByCategory, getRawMaterial, getRawMaterials, updateRawMaterial } from "../controllers/rawMaterialController.js";
import { authenticate } from "../middleware/auth.js";
import { requireManager } from "../middleware/rbac.js";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/raw-materials - Get all raw materials with optional filtering
router.get("/", getRawMaterials);

// GET /api/raw-materials/low-stock - Get low stock materials
router.get("/low-stock", getLowStockMaterials);

// GET /api/raw-materials/category/:category - Get materials by category
router.get("/category/:category", getMaterialsByCategory);

// GET /api/raw-materials/:id - Get raw material by ID
router.get("/:id", getRawMaterial);

// POST /api/raw-materials - Create new raw material (Admin/Manager only)
router.post("/", requireManager, createRawMaterial);

// PUT /api/raw-materials/:id - Update raw material (Admin/Manager only)
router.put("/:id", requireManager, updateRawMaterial);

// DELETE /api/raw-materials/:id - Delete raw material (Admin/Manager only)
router.delete("/:id", requireManager, deleteRawMaterial);

export default router;

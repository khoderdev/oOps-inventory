import express from "express";
import * as supplierController from "../controllers/supplierController.js";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/rbac.js";

const router = express.Router();

// Middleware - all routes require authentication and admin access
router.use(authenticate);
router.use(requireAdmin);

// Supplier CRUD routes
router.post("/", supplierController.createSupplier);
router.get("/", supplierController.getSuppliers);
router.get("/analytics", supplierController.getSupplierAnalytics);
router.get("/:id", supplierController.getSupplierById);
router.put("/:id", supplierController.updateSupplier);
router.delete("/:id", supplierController.deleteSupplier);

// Supplier performance and analysis routes
router.get("/:id/performance", supplierController.getSupplierPerformance);
router.get("/compare/:materialId", supplierController.getSupplierComparison);

// Supplier material pricing routes
router.post("/materials", supplierController.updateSupplierMaterial);

export default router;

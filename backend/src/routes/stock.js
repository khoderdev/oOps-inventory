import { Router } from "express";
import { createStockEntry, createStockMovement, deleteStockEntry, getConsumptionReport, getCurrentStockLevels, getExpenseReport, getLowStockReport, getReportsData, getStockEntries, getStockLevel, getStockMovements, transferStock, updateStockEntry } from "../controllers/stockController.js";
import { authenticate } from "../middleware/auth.js";
import { requireManager } from "../middleware/rbac.js";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Stock Entries Routes

// GET /api/stock/entries - Get all stock entries with optional filtering
router.get("/entries", getStockEntries);

// POST /api/stock/entries - Create new stock entry (Manager only)
router.post("/entries", requireManager, createStockEntry);

// PUT /api/stock/entries/:id - Update stock entry (Manager only)
router.put("/entries/:id", requireManager, updateStockEntry);

// DELETE /api/stock/entries/:id - Delete stock entry (Manager only)
router.delete("/entries/:id", requireManager, deleteStockEntry);

// Stock Movements Routes

// GET /api/stock/movements - Get stock movements with optional filtering
router.get("/movements", getStockMovements);

// POST /api/stock/movements - Create stock movement (Manager only)
router.post("/movements", requireManager, createStockMovement);

// Stock Levels Routes

// GET /api/stock/levels - Get current stock levels for all materials
router.get("/levels", getCurrentStockLevels);

// GET /api/stock/levels/:rawMaterialId - Get stock level for specific material
router.get("/levels/:rawMaterialId", getStockLevel);

// Stock Transfer Routes

// POST /api/stock/transfer - Transfer stock between sections (Manager only)
router.post("/transfer", requireManager, transferStock);

// Reports Routes

// GET /api/stock/reports - Get comprehensive reports data
router.get("/reports", getReportsData);

// GET /api/stock/reports/consumption - Get consumption report data
router.get("/reports/consumption", getConsumptionReport);

// GET /api/stock/reports/expenses - Get expense report data
router.get("/reports/expenses", getExpenseReport);

// GET /api/stock/reports/low-stock - Get low stock report data
router.get("/reports/low-stock", getLowStockReport);

export default router;

import express from "express";
import { createPosSale, getAllPosSales, getPosSaleById } from "../controllers/posController.js";

const router = express.Router();

// POST /api/pos/sales - Create new POS sale
router.post("/sales", createPosSale);

// GET /api/pos/sales - List all POS sales (with optional filters)
router.get("/sales", getAllPosSales);

// GET /api/pos/sales/:id - Get specific sale by ID
router.get("/sales/:id", getPosSaleById);

export default router;

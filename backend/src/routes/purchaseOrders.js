import express from "express";
import * as purchaseOrderController from "../controllers/purchaseOrderController.js";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/rbac.js";

const router = express.Router();

// Middleware - all routes require authentication and admin access
router.use(authenticate);
router.use(requireAdmin);

// Purchase Order CRUD routes
router.post("/", purchaseOrderController.createPurchaseOrder);
router.get("/", purchaseOrderController.getPurchaseOrders);
router.get("/analytics", purchaseOrderController.getPurchaseOrderAnalytics);
router.get("/reorder-suggestions", purchaseOrderController.getReorderSuggestions);
router.get("/:id", purchaseOrderController.getPurchaseOrderById);

// Purchase Order workflow routes
router.put("/:id/approve", purchaseOrderController.approvePurchaseOrder);
router.put("/:id/send", purchaseOrderController.sendPurchaseOrder);
router.post("/:id/receive", purchaseOrderController.receiveGoods);

export default router;

import { asyncHandler } from "../middleware/errorHandler.js";
import * as purchaseOrderService from "../services/purchaseOrderService.js";

/**
 * Create a new purchase order
 * POST /api/purchase-orders
 */
export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const result = await purchaseOrderService.createPurchaseOrder({
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
 * Get purchase orders with filtering
 * GET /api/purchase-orders
 */
export const getPurchaseOrders = asyncHandler(async (req, res) => {
  const result = await purchaseOrderService.getPurchaseOrders(req.query);

  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Get purchase order by ID
 * GET /api/purchase-orders/:id
 */
export const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await purchaseOrderService.getPurchaseOrders({
    id: parseInt(id),
    limit: 1
  });

  if (!result.success || result.data.orders.length === 0) {
    return res.status(404).json({
      success: false,
      error: "Purchase order not found"
    });
  }

  res.json({
    success: true,
    data: result.data.orders[0]
  });
});

/**
 * Approve purchase order
 * PUT /api/purchase-orders/:id/approve
 */
export const approvePurchaseOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await purchaseOrderService.approvePurchaseOrder(id, req.user.id);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Send purchase order to supplier
 * PUT /api/purchase-orders/:id/send
 */
export const sendPurchaseOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await purchaseOrderService.sendPurchaseOrder(id);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Receive goods against purchase order
 * POST /api/purchase-orders/:id/receive
 */
export const receiveGoods = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await purchaseOrderService.receiveGoods({
    ...req.body,
    purchase_order_id: id,
    received_by: req.user.id
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Get purchase order analytics
 * GET /api/purchase-orders/analytics
 */
export const getPurchaseOrderAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const result = await purchaseOrderService.getPurchaseOrderAnalytics(parseInt(days));

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
 * Get reorder suggestions
 * GET /api/purchase-orders/reorder-suggestions
 */
export const getReorderSuggestions = asyncHandler(async (req, res) => {
  const result = await purchaseOrderService.getReorderSuggestions();

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

import prisma from "../config/prisma.js";
import * as posService from "../services/posService.js";
import logger from "../utils/logger.js";
/**
 * Record a new POS Sale
 * POST /api/pos/sales
 */
export const createPosSale = async (req, res) => {
  try {
    console.log("[CONTROLLER] Received request to create POS sale with body:", JSON.stringify(req.body, null, 2));

    // Transform request body to match service expectations
    const saleData = {
      ...req.body,
      subtotal: req.body.subtotal,
      total: req.body.total,
      tax: req.body.tax || 0,
      status: req.body.status || "COMPLETED",
      saleDate: req.body.saleDate || new Date()
    };

    console.log("[CONTROLLER] Processed sale data before service call:", JSON.stringify(saleData, null, 2));
    console.log("[CONTROLLER] Prisma instance check:", prisma ? "Available" : "Undefined");

    const result = await posService.createPosSale(saleData);

    if (!result.success) {
      console.error("[CONTROLLER] POS sale creation failed:", result.message);
      logger.warn("Failed to create POS sale:", result.message);
      return res.status(400).json(result);
    }

    console.log("[CONTROLLER] POS sale created successfully:", result.data.id);
    res.status(201).json(result);
  } catch (error) {
    console.error("[CONTROLLER] Unexpected error in createPosSale:", error.stack);
    logger.error("Error in createPosSale controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while processing sale"
    });
  }
};

/**
 * Get all POS sales with optional date filtering
 * GET /api/pos/sales
 */
export const getAllPosSales = async (req, res) => {
  try {
    const { startDate, endDate, sectionId } = req.query;
    const result = await posService.getAllPosSales({ startDate, endDate, sectionId });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error("Error in getAllPosSales controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch POS sales"
    });
  }
};

/**
 * Get single POS sale by ID
 * GET /api/pos/sales/:id
 */
export const getPosSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await posService.getPosSaleById(id);

    if (!result.success) {
      const statusCode = result.code === "NOT_FOUND" ? 404 : 400;
      return res.status(statusCode).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error(`Error in getPosSaleById controller for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sale details"
    });
  }
};

import * as costControlService from "../services/costControlService.js";
import logger from "../utils/logger.js";

/**
 * Get comprehensive cost control dashboard
 */
export const getCostControlDashboard = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await costControlService.getCostControlDashboard(days);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error("Error in getCostControlDashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cost control dashboard"
    });
  }
};

/**
 * Get detailed cost analytics
 */
export const getCostAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const category = req.query.category;
    const result = await costControlService.getCostAnalytics(days, category);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error("Error in getCostAnalytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cost analytics"
    });
  }
};

/**
 * Get supplier cost comparison analysis
 */
export const getSupplierAnalysis = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await costControlService.getSupplierCostAnalysis(days);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error("Error in getSupplierAnalysis:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch supplier analysis"
    });
  }
};

/**
 * Get cost optimization recommendations
 */
export const getOptimizationRecommendations = async (req, res) => {
  try {
    const result = await costControlService.getCostOptimizationRecommendations();

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error("Error in getOptimizationRecommendations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch optimization recommendations"
    });
  }
};

/**
 * Get cost trend analysis
 */
export const getCostTrendAnalysis = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const result = await costControlService.getCostTrendAnalysis(days);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error("Error in getCostTrendAnalysis:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cost trend analysis"
    });
  }
};

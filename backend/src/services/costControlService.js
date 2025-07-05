import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";

/**
 * Helper function to format financial data for frontend
 */
const formatFinancialData = value => parseFloat(value?.toString() || "0");

/**
 * Calculate inventory turnover rate for materials
 */
const calculateInventoryTurnover = async (materialId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get total consumption for the period
  const consumptions = await prisma().sectionConsumption.findMany({
    where: {
      raw_material_id: materialId,
      consumed_date: { gte: startDate }
    }
  });

  const totalConsumed = consumptions.reduce((sum, c) => sum + formatFinancialData(c.quantity), 0);

  // Get average inventory level
  const inventoryLevels = await prisma().sectionInventory.findMany({
    where: { raw_material_id: materialId },
    include: { raw_material: true }
  });

  const avgInventory = inventoryLevels.reduce((sum, inv) => sum + formatFinancialData(inv.quantity), 0);

  return avgInventory > 0 ? (totalConsumed / avgInventory) * (365 / days) : 0;
};

/**
 * Get comprehensive cost analytics for the admin dashboard
 */
export const getCostAnalytics = async (days = 30, categoryFilter = null) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all raw materials for cost calculations
    const rawMaterials = await prisma().rawMaterial.findMany({
      where: {
        is_active: true,
        ...(categoryFilter && { category: categoryFilter })
      },
      include: {
        stock_entries: {
          where: {
            received_date: { gte: startDate }
          },
          include: {
            stock_movements: true
          }
        },
        section_consumptions: {
          where: {
            consumed_date: { gte: startDate }
          }
        },
        section_inventories: true
      }
    });

    // Calculate comprehensive cost metrics
    const totalPurchaseCosts = rawMaterials.reduce((sum, material) => {
      return sum + material.stock_entries.reduce((entrySum, entry) => entrySum + formatFinancialData(entry.total_cost), 0);
    }, 0);

    const totalConsumptionCosts = rawMaterials.reduce((sum, material) => {
      return sum + material.section_consumptions.reduce((consumptionSum, consumption) => consumptionSum + formatFinancialData(consumption.quantity) * formatFinancialData(material.unit_cost), 0);
    }, 0);

    // Calculate current inventory value
    const currentInventoryValue = rawMaterials.reduce((sum, material) => {
      const totalInventory = material.section_inventories.reduce((invSum, inv) => invSum + formatFinancialData(inv.quantity), 0);
      return sum + totalInventory * formatFinancialData(material.unit_cost);
    }, 0);

    // Calculate waste costs (expired/damaged stock)
    const wasteMovements = await prisma().stockMovement.findMany({
      where: {
        type: { in: ["EXPIRED", "DAMAGED"] },
        created_at: { gte: startDate }
      },
      include: {
        stock_entry: {
          include: {
            raw_material: true
          }
        }
      }
    });

    const totalWasteCosts = wasteMovements.reduce((sum, movement) => {
      const unitCost = formatFinancialData(movement.stock_entry.unit_cost);
      const quantity = formatFinancialData(movement.quantity);
      return sum + unitCost * quantity;
    }, 0);

    // Restaurant-specific metrics
    const foodCostPercentage = totalPurchaseCosts > 0 ? (totalConsumptionCosts / totalPurchaseCosts) * 100 : 0;
    const wastePercentage = totalPurchaseCosts > 0 ? (totalWasteCosts / totalPurchaseCosts) * 100 : 0;
    const inventoryTurnoverRatio = currentInventoryValue > 0 ? (totalConsumptionCosts / currentInventoryValue) * (365 / days) : 0;
    const costEfficiencyRatio = totalConsumptionCosts > 0 ? ((totalConsumptionCosts - totalWasteCosts) / totalConsumptionCosts) * 100 : 0;

    // Detailed category breakdown with restaurant metrics
    const categoryBreakdown = {};
    for (const material of rawMaterials) {
      const categoryKey = material.category;
      if (!categoryBreakdown[categoryKey]) {
        categoryBreakdown[categoryKey] = {
          purchaseCosts: 0,
          consumptionCosts: 0,
          wasteCosts: 0,
          inventoryValue: 0,
          itemCount: 0,
          avgCostPerUnit: 0,
          turnoverRate: 0,
          profitabilityScore: 0
        };
      }

      const purchaseCost = material.stock_entries.reduce((sum, entry) => sum + formatFinancialData(entry.total_cost), 0);

      const consumptionCost = material.section_consumptions.reduce((sum, consumption) => sum + formatFinancialData(consumption.quantity) * formatFinancialData(material.unit_cost), 0);

      const inventoryValue = material.section_inventories.reduce((sum, inv) => sum + formatFinancialData(inv.quantity) * formatFinancialData(material.unit_cost), 0);

      const turnover = await calculateInventoryTurnover(material.id, days);

      categoryBreakdown[categoryKey].purchaseCosts += purchaseCost;
      categoryBreakdown[categoryKey].consumptionCosts += consumptionCost;
      categoryBreakdown[categoryKey].inventoryValue += inventoryValue;
      categoryBreakdown[categoryKey].itemCount += 1;
      categoryBreakdown[categoryKey].turnoverRate += turnover;
      categoryBreakdown[categoryKey].profitabilityScore = consumptionCost > 0 ? ((consumptionCost - totalWasteCosts * (consumptionCost / totalConsumptionCosts)) / consumptionCost) * 100 : 0;
    }

    // Calculate average values for categories
    Object.keys(categoryBreakdown).forEach(category => {
      const data = categoryBreakdown[category];
      data.avgCostPerUnit = data.itemCount > 0 ? data.purchaseCosts / data.itemCount : 0;
      data.turnoverRate = data.itemCount > 0 ? data.turnoverRate / data.itemCount : 0;
    });

    // Add waste costs to category breakdown
    wasteMovements.forEach(movement => {
      const category = movement.stock_entry.raw_material.category;
      if (categoryBreakdown[category]) {
        const wasteCost = formatFinancialData(movement.stock_entry.unit_cost) * formatFinancialData(movement.quantity);
        categoryBreakdown[category].wasteCosts += wasteCost;
      }
    });

    // Calculate material performance metrics
    const materialPerformance = await Promise.all(
      rawMaterials.slice(0, 20).map(async material => {
        const turnover = await calculateInventoryTurnover(material.id, days);
        const consumptionCost = material.section_consumptions.reduce((sum, consumption) => sum + formatFinancialData(consumption.quantity) * formatFinancialData(material.unit_cost), 0);
        const inventoryValue = material.section_inventories.reduce((sum, inv) => sum + formatFinancialData(inv.quantity) * formatFinancialData(material.unit_cost), 0);

        return {
          id: material.id,
          name: material.name,
          category: material.category,
          unitCost: formatFinancialData(material.unit_cost),
          consumptionValue: consumptionCost,
          inventoryValue,
          turnoverRate: turnover,
          performanceScore: turnover * (consumptionCost / Math.max(inventoryValue, 1)),
          usage: material.section_consumptions.length,
          lastUsed: material.section_consumptions.length > 0 ? Math.max(...material.section_consumptions.map(c => new Date(c.consumed_date).getTime())) : null
        };
      })
    );

    // Top performing and underperforming materials
    const topPerformers = materialPerformance.sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 10);

    const underPerformers = materialPerformance
      .filter(m => m.inventoryValue > 50) // Only consider materials with significant inventory
      .sort((a, b) => a.performanceScore - b.performanceScore)
      .slice(0, 10);

    // Cost trend analysis by week
    const weeklyTrends = [];
    const weeksToAnalyze = Math.min(12, Math.floor(days / 7));

    for (let week = 0; week < weeksToAnalyze; week++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (week + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - week * 7);

      const weekEntries = await prisma().stockEntry.findMany({
        where: {
          received_date: { gte: weekStart, lt: weekEnd }
        }
      });

      const weekConsumptions = await prisma().sectionConsumption.findMany({
        where: {
          consumed_date: { gte: weekStart, lt: weekEnd }
        },
        include: { raw_material: true }
      });

      const weekPurchaseCosts = weekEntries.reduce((sum, entry) => sum + formatFinancialData(entry.total_cost), 0);

      const weekConsumptionCosts = weekConsumptions.reduce((sum, consumption) => sum + formatFinancialData(consumption.quantity) * formatFinancialData(consumption.raw_material.unit_cost), 0);

      weeklyTrends.unshift({
        week: `Week ${weeksToAnalyze - week}`,
        startDate: weekStart,
        endDate: weekEnd,
        purchaseCosts: weekPurchaseCosts,
        consumptionCosts: weekConsumptionCosts,
        efficiency: weekConsumptionCosts > 0 ? weekPurchaseCosts / weekConsumptionCosts : 0
      });
    }

    return {
      success: true,
      data: {
        overview: {
          totalPurchaseCosts,
          totalConsumptionCosts,
          totalWasteCosts,
          currentInventoryValue,
          foodCostPercentage,
          wastePercentage,
          inventoryTurnoverRatio,
          costEfficiencyRatio,
          netCostSavings: totalPurchaseCosts - totalConsumptionCosts - totalWasteCosts,
          averageDailyCost: totalConsumptionCosts / days,
          projectedMonthlyCost: (totalConsumptionCosts / days) * 30
        },
        categoryBreakdown,
        materialPerformance: {
          topPerformers,
          underPerformers,
          averagePerformanceScore: materialPerformance.length > 0 ? materialPerformance.reduce((sum, m) => sum + m.performanceScore, 0) / materialPerformance.length : 0
        },
        trends: {
          weeklyTrends,
          trendDirection: weeklyTrends.length > 1 ? (weeklyTrends[weeklyTrends.length - 1].consumptionCosts > weeklyTrends[0].consumptionCosts ? "increasing" : "decreasing") : "stable"
        },
        period: {
          days,
          startDate,
          endDate: new Date()
        }
      }
    };
  } catch (error) {
    logger.error("Error in getCostAnalytics:", error);
    return {
      success: false,
      message: "Failed to fetch cost analytics"
    };
  }
};

/**
 * Get detailed supplier cost comparison analysis with scorecards
 */
export const getSupplierCostAnalysis = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stockEntries = await prisma().stockEntry.findMany({
      where: {
        received_date: { gte: startDate },
        supplier: { not: null }
      },
      include: {
        raw_material: true
      }
    });

    // Group by supplier and material with detailed analysis
    const supplierAnalysis = {};

    stockEntries.forEach(entry => {
      const supplier = entry.supplier;
      const materialId = entry.raw_material.id;
      const materialName = entry.raw_material.name;
      const category = entry.raw_material.category;

      if (!supplierAnalysis[supplier]) {
        supplierAnalysis[supplier] = {
          totalCost: 0,
          orderCount: 0,
          materials: {},
          categories: new Set(),
          deliveryPerformance: {
            onTimeDeliveries: 0,
            totalDeliveries: 0
          },
          qualityScore: 0,
          costTrend: [],
          lastOrderDate: null
        };
      }

      if (!supplierAnalysis[supplier].materials[materialId]) {
        supplierAnalysis[supplier].materials[materialId] = {
          name: materialName,
          category,
          totalCost: 0,
          totalQuantity: 0,
          orderCount: 0,
          avgUnitCost: 0,
          priceHistory: [],
          costVariance: 0,
          reliability: 0
        };
      }

      const cost = formatFinancialData(entry.total_cost);
      const quantity = formatFinancialData(entry.quantity);
      const unitCost = formatFinancialData(entry.unit_cost);

      supplierAnalysis[supplier].totalCost += cost;
      supplierAnalysis[supplier].orderCount += 1;
      supplierAnalysis[supplier].categories.add(category);
      supplierAnalysis[supplier].lastOrderDate = entry.received_date;

      const material = supplierAnalysis[supplier].materials[materialId];
      material.totalCost += cost;
      material.totalQuantity += quantity;
      material.orderCount += 1;
      material.avgUnitCost = material.totalCost / material.totalQuantity;
      material.priceHistory.push({
        date: entry.received_date,
        unitCost,
        quantity
      });
    });

    // Calculate supplier scorecards
    const supplierScorecards = Object.entries(supplierAnalysis)
      .map(([supplier, data]) => {
        // Calculate price consistency (lower variance is better)
        const allPrices = Object.values(data.materials).flatMap(m => m.priceHistory.map(p => p.unitCost));
        const avgPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
        const priceVariance = allPrices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / allPrices.length;
        const priceConsistency = avgPrice > 0 ? Math.max(0, 100 - (Math.sqrt(priceVariance) / avgPrice) * 100) : 0;

        // Calculate volume reliability (consistent order sizes)
        const orderSizes = Object.values(data.materials).flatMap(m => m.priceHistory.map(p => p.quantity));
        const avgOrderSize = orderSizes.reduce((sum, size) => sum + size, 0) / orderSizes.length;
        const sizeVariance = orderSizes.reduce((sum, size) => sum + Math.pow(size - avgOrderSize, 2), 0) / orderSizes.length;
        const volumeReliability = avgOrderSize > 0 ? Math.max(0, 100 - (Math.sqrt(sizeVariance) / avgOrderSize) * 50) : 0;

        // Calculate cost competitiveness
        const competitivenessScore = 85; // This would be calculated against market rates in real implementation

        // Overall supplier score
        const overallScore = priceConsistency * 0.3 + volumeReliability * 0.3 + competitivenessScore * 0.4;

        return {
          supplier,
          totalCost: data.totalCost,
          orderCount: data.orderCount,
          avgOrderValue: data.totalCost / data.orderCount,
          categoryCount: data.categories.size,
          materialCount: Object.keys(data.materials).length,
          lastOrderDate: data.lastOrderDate,
          scorecard: {
            overall: overallScore,
            priceConsistency,
            volumeReliability,
            competitiveness: competitivenessScore,
            grade: overallScore >= 90 ? "A" : overallScore >= 80 ? "B" : overallScore >= 70 ? "C" : "D"
          },
          materials: Object.values(data.materials),
          costPerCategory: Array.from(data.categories).reduce((acc, category) => {
            acc[category] = Object.values(data.materials)
              .filter(m => m.category === category)
              .reduce((sum, m) => sum + m.totalCost, 0);
            return acc;
          }, {}),
          trends: {
            costTrend: data.costTrend,
            recentPerformance: "stable" // This would be calculated from recent orders
          }
        };
      })
      .sort((a, b) => b.scorecard.overall - a.scorecard.overall);

    // Find detailed optimization opportunities
    const materialComparisons = {};
    Object.values(supplierAnalysis).forEach(supplierData => {
      Object.entries(supplierData.materials).forEach(([materialId, materialData]) => {
        if (!materialComparisons[materialId]) {
          materialComparisons[materialId] = {
            name: materialData.name,
            category: materialData.category,
            suppliers: []
          };
        }
        materialComparisons[materialId].suppliers.push({
          supplier: Object.keys(supplierAnalysis).find(s => supplierAnalysis[s].materials[materialId] === materialData),
          avgUnitCost: materialData.avgUnitCost,
          totalQuantity: materialData.totalQuantity,
          orderCount: materialData.orderCount,
          reliability: materialData.reliability || 85,
          lastOrder: Math.max(...materialData.priceHistory.map(p => new Date(p.date).getTime()))
        });
      });
    });

    // Enhanced optimization opportunities
    const optimizationOpportunities = Object.values(materialComparisons)
      .filter(material => material.suppliers.length > 1)
      .map(material => {
        const sortedSuppliers = material.suppliers.sort((a, b) => a.avgUnitCost - b.avgUnitCost);
        const cheapest = sortedSuppliers[0];
        const currentMostUsed = sortedSuppliers.find(s => s.totalQuantity === Math.max(...sortedSuppliers.map(sup => sup.totalQuantity))) || sortedSuppliers[0];

        const potentialSavings = currentMostUsed.avgUnitCost > cheapest.avgUnitCost ? (currentMostUsed.avgUnitCost - cheapest.avgUnitCost) * currentMostUsed.totalQuantity : 0;

        const riskScore = cheapest.reliability < 80 ? "HIGH" : cheapest.reliability < 90 ? "MEDIUM" : "LOW";

        return {
          materialName: material.name,
          category: material.category,
          currentSupplier: currentMostUsed.supplier,
          currentPrice: currentMostUsed.avgUnitCost,
          recommendedSupplier: cheapest.supplier,
          recommendedPrice: cheapest.avgUnitCost,
          potentialSavings,
          annualSavings: potentialSavings * (365 / days),
          riskScore,
          reliabilityDiff: cheapest.reliability - currentMostUsed.reliability,
          savingsPercentage: currentMostUsed.avgUnitCost > 0 ? ((currentMostUsed.avgUnitCost - cheapest.avgUnitCost) / currentMostUsed.avgUnitCost) * 100 : 0,
          confidence: cheapest.orderCount >= 3 ? "HIGH" : cheapest.orderCount >= 2 ? "MEDIUM" : "LOW"
        };
      })
      .filter(opp => opp.potentialSavings > 0)
      .sort((a, b) => b.annualSavings - a.annualSavings)
      .slice(0, 15);

    return {
      success: true,
      data: {
        supplierScorecards,
        optimizationOpportunities,
        totalPotentialSavings: optimizationOpportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0),
        totalAnnualSavings: optimizationOpportunities.reduce((sum, opp) => sum + opp.annualSavings, 0),
        summary: {
          totalSuppliers: supplierScorecards.length,
          averageScore: supplierScorecards.reduce((sum, s) => sum + s.scorecard.overall, 0) / supplierScorecards.length,
          topPerformers: supplierScorecards.filter(s => s.scorecard.overall >= 90).length,
          needsAttention: supplierScorecards.filter(s => s.scorecard.overall < 70).length
        }
      }
    };
  } catch (error) {
    logger.error("Error in getSupplierCostAnalysis:", error);
    return {
      success: false,
      message: "Failed to fetch supplier cost analysis"
    };
  }
};

/**
 * Get advanced cost optimization recommendations
 */
export const getCostOptimizationRecommendations = async () => {
  try {
    const recommendations = [];

    // Get current stock levels and consumption patterns
    const stockLevels = await prisma().sectionInventory.findMany({
      include: {
        raw_material: true,
        section: true
      }
    });

    // Get recent consumption data (last 30 days)
    const recentConsumptions = await prisma().sectionConsumption.findMany({
      where: {
        consumed_date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        raw_material: true,
        section: true
      }
    });

    // Get supplier analysis for optimization opportunities
    const supplierAnalysis = await getSupplierCostAnalysis(30);

    // 1. Overstock alerts with detailed analysis
    const overstockItems = stockLevels.filter(level => {
      const currentStock = formatFinancialData(level.quantity);
      const maxLevel = formatFinancialData(level.max_level);
      return maxLevel > 0 && currentStock > maxLevel * 1.2;
    });

    if (overstockItems.length > 0) {
      const totalOverstockValue = overstockItems.reduce((sum, item) => sum + formatFinancialData(item.quantity) * formatFinancialData(item.raw_material.unit_cost), 0);

      const topOverstockItems = overstockItems
        .map(item => ({
          name: item.raw_material.name,
          section: item.section.name,
          currentStock: formatFinancialData(item.quantity),
          maxLevel: formatFinancialData(item.max_level),
          excessQuantity: formatFinancialData(item.quantity) - formatFinancialData(item.max_level),
          excessValue: (formatFinancialData(item.quantity) - formatFinancialData(item.max_level)) * formatFinancialData(item.raw_material.unit_cost),
          daysToClear: Math.ceil((formatFinancialData(item.quantity) - formatFinancialData(item.max_level)) / Math.max(1, recentConsumptions.filter(c => c.raw_material_id === item.raw_material_id).reduce((sum, c) => sum + formatFinancialData(c.quantity), 0) / 30))
        }))
        .sort((a, b) => b.excessValue - a.excessValue)
        .slice(0, 10);

      recommendations.push({
        type: "OVERSTOCK_ALERT",
        priority: "HIGH",
        title: "Critical Overstock Alert",
        description: `${overstockItems.length} items are significantly overstocked, tying up $${totalOverstockValue.toFixed(2)} in excess inventory`,
        impact: totalOverstockValue,
        action: "Implement immediate usage campaigns, reduce ordering quantities, or redistribute to other sections",
        items: topOverstockItems,
        urgency: "Immediate action required - risk of spoilage and waste",
        estimatedTimeToResolve: "7-14 days"
      });
    }

    // 2. Enhanced supplier optimization with risk assessment
    if (supplierAnalysis.success && supplierAnalysis.data.optimizationOpportunities.length > 0) {
      const topOpportunities = supplierAnalysis.data.optimizationOpportunities.slice(0, 8);
      const totalSavings = topOpportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);
      const annualSavings = topOpportunities.reduce((sum, opp) => sum + opp.annualSavings, 0);

      recommendations.push({
        type: "SUPPLIER_OPTIMIZATION",
        priority: "MEDIUM",
        title: "Strategic Supplier Optimization",
        description: `Potential savings of $${totalSavings.toFixed(2)} monthly ($${annualSavings.toFixed(2)} annually) by optimizing ${topOpportunities.length} supplier relationships`,
        impact: annualSavings,
        action: "Negotiate with current suppliers or switch to more cost-effective alternatives",
        items: topOpportunities.map(opp => ({
          ...opp,
          implementationRisk: opp.riskScore,
          timeToImplement: opp.confidence === "HIGH" ? "1-2 weeks" : "3-4 weeks",
          nextSteps: opp.confidence === "HIGH" ? "Ready for immediate negotiation" : "Requires supplier evaluation trial"
        })),
        urgency: "Plan for next procurement cycle",
        estimatedTimeToResolve: "30-60 days"
      });
    }

    // 3. Low consumption / slow-moving inventory analysis
    const consumptionMap = {};
    recentConsumptions.forEach(consumption => {
      const materialId = consumption.raw_material_id;
      if (!consumptionMap[materialId]) {
        consumptionMap[materialId] = {
          material: consumption.raw_material,
          totalQuantity: 0,
          totalValue: 0,
          frequency: 0,
          lastUsed: consumption.consumed_date
        };
      }
      const quantity = formatFinancialData(consumption.quantity);
      const value = quantity * formatFinancialData(consumption.raw_material.unit_cost);
      consumptionMap[materialId].totalQuantity += quantity;
      consumptionMap[materialId].totalValue += value;
      consumptionMap[materialId].frequency += 1;
      if (new Date(consumption.consumed_date) > new Date(consumptionMap[materialId].lastUsed)) {
        consumptionMap[materialId].lastUsed = consumption.consumed_date;
      }
    });

    const slowMovingItems = stockLevels.filter(level => {
      const materialId = level.raw_material_id;
      const currentStock = formatFinancialData(level.quantity);
      const stockValue = currentStock * formatFinancialData(level.raw_material.unit_cost);
      const consumption = consumptionMap[materialId];

      // Consider slow-moving if: high stock value, low usage frequency, or not used recently
      return stockValue > 100 && (!consumption || consumption.frequency < 5 || new Date() - new Date(consumption.lastUsed) > 15 * 24 * 60 * 60 * 1000); // 15 days
    });

    if (slowMovingItems.length > 0) {
      const totalSlowMovingValue = slowMovingItems.reduce((sum, item) => sum + formatFinancialData(item.quantity) * formatFinancialData(item.raw_material.unit_cost), 0);

      const detailedSlowMovingItems = slowMovingItems
        .map(item => ({
          name: item.raw_material.name,
          category: item.raw_material.category,
          stockValue: formatFinancialData(item.quantity) * formatFinancialData(item.raw_material.unit_cost),
          daysInInventory: consumptionMap[item.raw_material_id] ? Math.floor((new Date() - new Date(consumptionMap[item.raw_material_id].lastUsed)) / (24 * 60 * 60 * 1000)) : 999,
          usageFrequency: consumptionMap[item.raw_material_id]?.frequency || 0,
          recommendedAction: consumptionMap[item.raw_material_id]?.frequency > 0 ? "Reduce order quantities" : "Consider menu changes or removal"
        }))
        .sort((a, b) => b.stockValue - a.stockValue)
        .slice(0, 12);

      recommendations.push({
        type: "SLOW_MOVING_INVENTORY",
        priority: "MEDIUM",
        title: "Slow-Moving Inventory Optimization",
        description: `${slowMovingItems.length} items with slow turnover are tying up $${totalSlowMovingValue.toFixed(2)} in working capital`,
        impact: totalSlowMovingValue * 0.3, // Estimated cost of capital
        action: "Review menu usage, implement promotional campaigns, or adjust procurement strategies",
        items: detailedSlowMovingItems,
        urgency: "Review during next menu planning cycle",
        estimatedTimeToResolve: "30-90 days"
      });
    }

    // 4. Waste reduction opportunities
    const wasteMovements = await prisma().stockMovement.findMany({
      where: {
        type: { in: ["EXPIRED", "DAMAGED"] },
        created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      include: {
        stock_entry: {
          include: { raw_material: true }
        }
      }
    });

    if (wasteMovements.length > 0) {
      const totalWasteValue = wasteMovements.reduce((sum, movement) => sum + formatFinancialData(movement.quantity) * formatFinancialData(movement.stock_entry.unit_cost), 0);

      const wasteByCategory = {};
      wasteMovements.forEach(movement => {
        const category = movement.stock_entry.raw_material.category;
        if (!wasteByCategory[category]) {
          wasteByCategory[category] = { value: 0, count: 0, items: [] };
        }
        const wasteValue = formatFinancialData(movement.quantity) * formatFinancialData(movement.stock_entry.unit_cost);
        wasteByCategory[category].value += wasteValue;
        wasteByCategory[category].count += 1;
        wasteByCategory[category].items.push({
          name: movement.stock_entry.raw_material.name,
          wasteValue,
          reason: movement.type,
          date: movement.created_at
        });
      });

      recommendations.push({
        type: "WASTE_REDUCTION",
        priority: "HIGH",
        title: "Waste Reduction Initiative",
        description: `$${totalWasteValue.toFixed(2)} lost to waste this month. Implement FIFO systems and better storage management`,
        impact: totalWasteValue * 12, // Annual impact
        action: "Improve inventory rotation, staff training, and storage conditions",
        items: Object.entries(wasteByCategory).map(([category, data]) => ({
          category,
          wasteValue: data.value,
          frequency: data.count,
          topWasteItems: data.items.sort((a, b) => b.wasteValue - a.wasteValue).slice(0, 3)
        })),
        urgency: "Immediate - implement FIFO and training programs",
        estimatedTimeToResolve: "2-4 weeks"
      });
    }

    return {
      success: true,
      data: {
        recommendations: recommendations.sort((a, b) => {
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }),
        totalPotentialSavings: recommendations.reduce((sum, rec) => sum + (rec.impact || 0), 0),
        summary: {
          totalRecommendations: recommendations.length,
          highPriority: recommendations.filter(r => r.priority === "HIGH").length,
          estimatedAnnualSavings: recommendations.reduce((sum, rec) => sum + (rec.impact || 0), 0),
          implementationTimeline: "2-12 weeks depending on recommendation type"
        }
      }
    };
  } catch (error) {
    logger.error("Error in getCostOptimizationRecommendations:", error);
    return {
      success: false,
      message: "Failed to generate cost optimization recommendations"
    };
  }
};

/**
 * Get cost trend analysis with seasonal patterns
 */
export const getCostTrendAnalysis = async (days = 90) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get stock entries and consumption data
    const [stockEntries, consumptions] = await Promise.all([
      prisma().stockEntry.findMany({
        where: { received_date: { gte: startDate } },
        include: { raw_material: true },
        orderBy: { received_date: "asc" }
      }),
      prisma().sectionConsumption.findMany({
        where: { consumed_date: { gte: startDate } },
        include: { raw_material: true },
        orderBy: { consumed_date: "asc" }
      })
    ]);

    // Group by week with enhanced metrics
    const weeklyData = {};
    const weeklyConsumption = {};

    stockEntries.forEach(entry => {
      const weekStart = new Date(entry.received_date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          totalCost: 0,
          orderCount: 0,
          categories: {},
          avgOrderSize: 0,
          priceVolatility: 0
        };
      }

      const cost = formatFinancialData(entry.total_cost);
      weeklyData[weekKey].totalCost += cost;
      weeklyData[weekKey].orderCount += 1;

      const category = entry.raw_material.category;
      if (!weeklyData[weekKey].categories[category]) {
        weeklyData[weekKey].categories[category] = 0;
      }
      weeklyData[weekKey].categories[category] += cost;
    });

    consumptions.forEach(consumption => {
      const weekStart = new Date(consumption.consumed_date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeklyConsumption[weekKey]) {
        weeklyConsumption[weekKey] = { totalValue: 0, items: 0 };
      }

      const value = formatFinancialData(consumption.quantity) * formatFinancialData(consumption.raw_material.unit_cost);
      weeklyConsumption[weekKey].totalValue += value;
      weeklyConsumption[weekKey].items += 1;
    });

    // Combine and analyze trends
    const weeklyTrends = Object.entries(weeklyData)
      .map(([week, data]) => ({
        week,
        date: new Date(week),
        purchaseCosts: data.totalCost,
        consumptionCosts: weeklyConsumption[week]?.totalValue || 0,
        orderCount: data.orderCount,
        avgOrderValue: data.totalCost / data.orderCount || 0,
        costEfficiency: weeklyConsumption[week]?.totalValue > 0 ? data.totalCost / weeklyConsumption[week].totalValue : 0,
        categories: data.categories
      }))
      .sort((a, b) => new Date(a.week) - new Date(b.week));

    // Calculate trend metrics
    const trendAnalysis = {
      direction: "stable",
      volatility: 0,
      seasonality: "none",
      forecast: {
        nextWeekPrediction: 0,
        confidence: "medium"
      }
    };

    if (weeklyTrends.length > 4) {
      const recentTrends = weeklyTrends.slice(-4);
      const costs = recentTrends.map(w => w.purchaseCosts);
      const avgRecent = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
      const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - avgRecent, 2), 0) / costs.length;

      trendAnalysis.volatility = (Math.sqrt(variance) / avgRecent) * 100;
      trendAnalysis.direction = costs[costs.length - 1] > costs[0] ? "increasing" : "decreasing";
      trendAnalysis.forecast.nextWeekPrediction = avgRecent;
    }

    return {
      success: true,
      data: {
        weeklyTrends,
        trendAnalysis,
        period: { days, startDate, endDate: new Date() }
      }
    };
  } catch (error) {
    logger.error("Error in getCostTrendAnalysis:", error);
    return {
      success: false,
      message: "Failed to fetch cost trend analysis"
    };
  }
};

/**
 * Get cost control dashboard summary with all enhanced data
 */
export const getCostControlDashboard = async (days = 30) => {
  try {
    const [analytics, supplierAnalysis, trends, recommendations] = await Promise.all([getCostAnalytics(days), getSupplierCostAnalysis(days), getCostTrendAnalysis(days), getCostOptimizationRecommendations()]);

    return {
      success: true,
      data: {
        analytics: analytics.data,
        supplierAnalysis: supplierAnalysis.data,
        trends: trends.data,
        recommendations: recommendations.data
      }
    };
  } catch (error) {
    logger.error("Error in getCostControlDashboard:", error);
    return {
      success: false,
      message: "Failed to fetch cost control dashboard"
    };
  }
};

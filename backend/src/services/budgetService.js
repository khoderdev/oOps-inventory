import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";

/**
 * Create a new budget with category allocations
 */
export const createBudget = async budgetData => {
  try {
    const { allocations, ...budget } = budgetData;

    // Validate that allocations sum up to total budget
    const totalAllocated = allocations.reduce((sum, allocation) => sum + parseFloat(allocation.allocated_amount), 0);

    if (Math.abs(totalAllocated - parseFloat(budget.total_budget)) > 0.01) {
      return {
        success: false,
        message: "Budget allocations must sum up to total budget amount"
      };
    }

    const newBudget = await prisma().budget.create({
      data: {
        ...budget,
        start_date: new Date(budget.start_date),
        end_date: new Date(budget.end_date),
        total_budget: parseFloat(budget.total_budget),
        allocated_amount: totalAllocated,
        allocations: {
          create: allocations.map(allocation => ({
            category: allocation.category,
            allocated_amount: parseFloat(allocation.allocated_amount),
            notes: allocation.notes
          }))
        }
      },
      include: {
        allocations: true,
        creator: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    logger.info(`Budget created: ${newBudget.name}`);

    return {
      success: true,
      data: newBudget,
      message: "Budget created successfully"
    };
  } catch (error) {
    logger.error("Error creating budget:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get budgets with filtering
 */
export const getBudgets = async (filters = {}) => {
  try {
    const { period_type, is_active, year, page = 1, limit = 20 } = filters;

    const where = {};
    if (period_type) where.period_type = period_type;
    if (typeof is_active !== "undefined") where.is_active = is_active;
    if (year) {
      where.start_date = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${parseInt(year) + 1}-01-01`)
      };
    }

    const [budgets, total] = await Promise.all([
      prisma().budget.findMany({
        where,
        include: {
          allocations: true,
          creator: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true
            }
          }
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma().budget.count({ where })
    ]);

    // Add spending data to each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async budget => {
        const spendingData = await calculateBudgetSpending(budget.id);
        return {
          ...budget,
          spending: spendingData.data
        };
      })
    );

    return {
      success: true,
      data: {
        budgets: budgetsWithSpending,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    logger.error("Error fetching budgets:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Calculate actual spending against budget
 */
export const calculateBudgetSpending = async budgetId => {
  try {
    const budget = await prisma().budget.findUnique({
      where: { id: parseInt(budgetId) },
      include: {
        allocations: true
      }
    });

    if (!budget) {
      return {
        success: false,
        message: "Budget not found"
      };
    }

    // Get actual spending by category for the budget period
    const actualSpending = await prisma().$queryRaw`
      SELECT 
        rm.category,
        SUM(se.total_cost) as actual_spent
      FROM stock_entries se
      JOIN raw_materials rm ON se.raw_material_id = rm.id
      WHERE se.received_date >= ${budget.start_date}
        AND se.received_date <= ${budget.end_date}
      GROUP BY rm.category
    `;

    // Create spending map for easy lookup
    const spendingMap = {};
    actualSpending.forEach(item => {
      spendingMap[item.category] = parseFloat(item.actual_spent);
    });

    // Calculate variance for each allocation
    const allocationsWithVariance = budget.allocations.map(allocation => {
      const actualSpent = spendingMap[allocation.category] || 0;
      const budgetedAmount = parseFloat(allocation.allocated_amount);
      const variance = budgetedAmount - actualSpent;
      const variancePercentage = budgetedAmount > 0 ? (variance / budgetedAmount) * 100 : 0;
      const utilizationPercentage = budgetedAmount > 0 ? (actualSpent / budgetedAmount) * 100 : 0;

      return {
        ...allocation,
        actual_spent: actualSpent,
        variance,
        variancePercentage,
        utilizationPercentage,
        status: variance < 0 ? "OVER_BUDGET" : variance > budgetedAmount * 0.1 ? "UNDER_UTILIZED" : "ON_TRACK"
      };
    });

    const totalActualSpent = actualSpending.reduce((sum, item) => sum + parseFloat(item.actual_spent), 0);
    const totalBudgeted = parseFloat(budget.total_budget);
    const totalVariance = totalBudgeted - totalActualSpent;
    const totalVariancePercentage = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

    // Update budget with actual spending
    await prisma().budget.update({
      where: { id: parseInt(budgetId) },
      data: { spent_amount: totalActualSpent }
    });

    // Update allocation spending
    for (const allocation of allocationsWithVariance) {
      await prisma().budgetAllocation.update({
        where: { id: allocation.id },
        data: { spent_amount: allocation.actual_spent }
      });
    }

    return {
      success: true,
      data: {
        budgetId: budget.id,
        budgetName: budget.name,
        period: {
          type: budget.period_type,
          startDate: budget.start_date,
          endDate: budget.end_date
        },
        summary: {
          totalBudgeted,
          totalActualSpent,
          totalVariance,
          totalVariancePercentage,
          utilizationPercentage: totalBudgeted > 0 ? (totalActualSpent / totalBudgeted) * 100 : 0,
          status: totalVariance < 0 ? "OVER_BUDGET" : totalVariance > totalBudgeted * 0.1 ? "UNDER_UTILIZED" : "ON_TRACK"
        },
        allocations: allocationsWithVariance
      }
    };
  } catch (error) {
    logger.error("Error calculating budget spending:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get budget variance analysis
 */
export const getBudgetVarianceAnalysis = async budgetId => {
  try {
    const spendingData = await calculateBudgetSpending(budgetId);

    if (!spendingData.success) {
      return spendingData;
    }

    const { summary, allocations } = spendingData.data;

    // Identify categories with significant variances
    const significantVariances = allocations.filter(allocation => Math.abs(allocation.variancePercentage) > 10);

    // Generate variance insights
    const insights = [];

    // Over-budget categories
    const overBudgetCategories = allocations.filter(a => a.status === "OVER_BUDGET");
    if (overBudgetCategories.length > 0) {
      const totalOverspend = overBudgetCategories.reduce((sum, a) => sum + Math.abs(a.variance), 0);
      insights.push({
        type: "OVER_BUDGET",
        severity: "HIGH",
        message: `${overBudgetCategories.length} categories are over budget by a total of $${totalOverspend.toFixed(2)}`,
        categories: overBudgetCategories.map(a => a.category),
        recommendation: "Review purchasing decisions and consider cost reduction measures"
      });
    }

    // Under-utilized categories
    const underUtilizedCategories = allocations.filter(a => a.status === "UNDER_UTILIZED");
    if (underUtilizedCategories.length > 0) {
      const totalUnderutilized = underUtilizedCategories.reduce((sum, a) => sum + a.variance, 0);
      insights.push({
        type: "UNDER_UTILIZED",
        severity: "MEDIUM",
        message: `${underUtilizedCategories.length} categories are under-utilized with $${totalUnderutilized.toFixed(2)} unspent`,
        categories: underUtilizedCategories.map(a => a.category),
        recommendation: "Consider reallocating budget or increasing inventory for these categories"
      });
    }

    // Calculate trends (if we have historical data)
    const trends = await calculateBudgetTrends(budgetId);

    return {
      success: true,
      data: {
        ...spendingData.data,
        variance: {
          significantVariances,
          insights,
          trends: trends.data
        }
      }
    };
  } catch (error) {
    logger.error("Error getting budget variance analysis:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Calculate budget trends
 */
const calculateBudgetTrends = async budgetId => {
  try {
    const currentBudget = await prisma().budget.findUnique({
      where: { id: parseInt(budgetId) },
      include: { allocations: true }
    });

    if (!currentBudget) {
      return { success: false, message: "Budget not found" };
    }

    // Find previous budget of same type
    const previousBudget = await prisma().budget.findFirst({
      where: {
        period_type: currentBudget.period_type,
        end_date: { lt: currentBudget.start_date }
      },
      orderBy: { end_date: "desc" },
      include: { allocations: true }
    });

    if (!previousBudget) {
      return {
        success: true,
        data: {
          hasPreviousData: false,
          message: "No previous budget data available for trend analysis"
        }
      };
    }

    // Compare current vs previous budget performance
    const currentSpending = await calculateBudgetSpending(currentBudget.id);
    const previousSpending = await calculateBudgetSpending(previousBudget.id);

    if (!currentSpending.success || !previousSpending.success) {
      return { success: false, message: "Error calculating spending data" };
    }

    const trends = {
      totalSpendingTrend: {
        current: currentSpending.data.summary.totalActualSpent,
        previous: previousSpending.data.summary.totalActualSpent,
        change: currentSpending.data.summary.totalActualSpent - previousSpending.data.summary.totalActualSpent,
        changePercentage: previousSpending.data.summary.totalActualSpent > 0 ? ((currentSpending.data.summary.totalActualSpent - previousSpending.data.summary.totalActualSpent) / previousSpending.data.summary.totalActualSpent) * 100 : 0
      },
      categoryTrends: []
    };

    // Compare category trends
    currentSpending.data.allocations.forEach(currentAllocation => {
      const previousAllocation = previousSpending.data.allocations.find(pa => pa.category === currentAllocation.category);

      if (previousAllocation) {
        const spendingChange = currentAllocation.actual_spent - previousAllocation.actual_spent;
        const changePercentage = previousAllocation.actual_spent > 0 ? (spendingChange / previousAllocation.actual_spent) * 100 : 0;

        trends.categoryTrends.push({
          category: currentAllocation.category,
          current: currentAllocation.actual_spent,
          previous: previousAllocation.actual_spent,
          change: spendingChange,
          changePercentage,
          trend: spendingChange > 0 ? "INCREASING" : spendingChange < 0 ? "DECREASING" : "STABLE"
        });
      }
    });

    return {
      success: true,
      data: {
        hasPreviousData: true,
        comparisonPeriod: {
          current: `${currentBudget.start_date} to ${currentBudget.end_date}`,
          previous: `${previousBudget.start_date} to ${previousBudget.end_date}`
        },
        trends
      }
    };
  } catch (error) {
    logger.error("Error calculating budget trends:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Generate budget recommendations
 */
export const generateBudgetRecommendations = async budgetId => {
  try {
    const varianceAnalysis = await getBudgetVarianceAnalysis(budgetId);

    if (!varianceAnalysis.success) {
      return varianceAnalysis;
    }

    const { summary, allocations, variance } = varianceAnalysis.data;
    const recommendations = [];

    // Overall budget recommendations
    if (summary.status === "OVER_BUDGET") {
      recommendations.push({
        type: "BUDGET_CONTROL",
        priority: "HIGH",
        title: "Budget Overspend Alert",
        description: `Total spending is ${Math.abs(summary.totalVariancePercentage).toFixed(1)}% over budget`,
        actions: ["Review and approve all future purchases", "Implement stricter approval processes", "Consider emergency cost reduction measures", "Analyze spending patterns to identify cost drivers"],
        estimatedImpact: `Potential savings: $${Math.abs(summary.totalVariance).toFixed(2)}`
      });
    }

    // Category-specific recommendations
    allocations.forEach(allocation => {
      if (allocation.status === "OVER_BUDGET" && Math.abs(allocation.variancePercentage) > 15) {
        recommendations.push({
          type: "CATEGORY_OPTIMIZATION",
          priority: "HIGH",
          title: `${allocation.category} Category Over Budget`,
          description: `${allocation.category} spending is ${Math.abs(allocation.variancePercentage).toFixed(1)}% over budget`,
          actions: ["Review supplier contracts for this category", "Negotiate better pricing with current suppliers", "Consider alternative suppliers", "Optimize inventory levels to reduce waste", "Review consumption patterns and portion control"],
          estimatedImpact: `Reduce overspend by $${Math.abs(allocation.variance).toFixed(2)}`
        });
      }

      if (allocation.status === "UNDER_UTILIZED" && allocation.variancePercentage > 20) {
        recommendations.push({
          type: "BUDGET_REALLOCATION",
          priority: "MEDIUM",
          title: `${allocation.category} Budget Under-Utilized`,
          description: `${allocation.category} has unused budget of $${allocation.variance.toFixed(2)}`,
          actions: ["Consider reallocating funds to over-budget categories", "Increase inventory for better operational efficiency", "Invest in higher quality ingredients for this category", "Stock up during promotional pricing periods"],
          estimatedImpact: `Optimize $${allocation.variance.toFixed(2)} in unused budget`
        });
      }
    });

    // Seasonal and trend-based recommendations
    if (variance.trends && variance.trends.hasPreviousData) {
      const increasingCategories = variance.trends.trends.categoryTrends.filter(trend => trend.changePercentage > 20);

      if (increasingCategories.length > 0) {
        recommendations.push({
          type: "TREND_ANALYSIS",
          priority: "MEDIUM",
          title: "Rising Cost Categories Identified",
          description: `${increasingCategories.length} categories show significant cost increases`,
          actions: ["Investigate reasons for cost increases", "Consider long-term contracts to lock in pricing", "Explore bulk purchasing opportunities", "Review menu pricing to maintain margins"],
          categories: increasingCategories.map(cat => cat.category),
          estimatedImpact: "Stabilize costs and protect profit margins"
        });
      }
    }

    return {
      success: true,
      data: {
        budgetId: parseInt(budgetId),
        generatedAt: new Date(),
        recommendations,
        summary: {
          totalRecommendations: recommendations.length,
          highPriority: recommendations.filter(r => r.priority === "HIGH").length,
          mediumPriority: recommendations.filter(r => r.priority === "MEDIUM").length,
          lowPriority: recommendations.filter(r => r.priority === "LOW").length
        }
      }
    };
  } catch (error) {
    logger.error("Error generating budget recommendations:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

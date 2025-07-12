import prisma from "../config/prisma.js";
import { getEffectiveUnitCost } from "../utils/costing.js";
import logger from "../utils/logger.js";

export const createRecipe = async recipeData => {
  try {
    const { ingredients, ...recipe } = recipeData;
    const newRecipe = await prisma().recipe.create({ data: { ...recipe, ingredients: { create: ingredients.map(ingredient => ({ raw_material_id: ingredient.raw_material_id, quantity: parseFloat(ingredient.quantity), unit: ingredient.baseUnit, baseUnit: ingredient.baseUnit })) } }, include: { ingredients: { include: { raw_material: true } } } });
    const updatedRecipe = await calculateRecipeCost(newRecipe.id);
    logger.info(`Recipe created: ${newRecipe.name}`);
    return { success: true, data: updatedRecipe.data, message: "Recipe created successfully" };
  } catch (error) {
    logger.error("Error creating recipe:", error);
    return { success: false, message: error.message };
  }
};

export const updateRecipe = async (id, recipeData) => {
  try {
    const { ingredients, ...recipeFields } = recipeData;

    // Update main recipe fields
    await prisma().recipe.update({
      where: { id: Number(id) },
      data: recipeFields
    });

    // Delete existing ingredients linked to the recipe
    await prisma().recipeIngredient.deleteMany({
      where: { recipe_id: Number(id) }
    });

    // Create new ingredients
    if (ingredients && ingredients.length > 0) {
      await prisma().recipeIngredient.createMany({
        data: ingredients.map(ingredient => ({
          recipe_id: Number(id),
          raw_material_id: ingredient.raw_material_id,
          quantity: parseFloat(ingredient.quantity),
          unit: ingredient.baseUnit,
          baseUnit: ingredient.baseUnit
        }))
      });
    }

    // Recalculate and update recipe cost analysis
    const updatedRecipeCost = await calculateRecipeCost(Number(id));

    // Fetch the updated recipe with relations to return to frontend
    const updatedRecipe = await prisma().recipe.findUnique({
      where: { id: Number(id) },
      include: {
        ingredients: {
          include: {
            raw_material: true
          }
        },
        creator: true
        // Add other relations if needed
      }
    });

    logger.info(`Recipe updated: id=${id}`);
    return {
      success: true,
      data: {
        ...updatedRecipe,
        // optionally merge cost recalculation data if needed
        costAnalysis: updatedRecipeCost.data
      },
      message: "Recipe updated successfully"
    };
  } catch (error) {
    logger.error("Error updating recipe:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

export const calculateRecipeCost = async recipeId => {
  try {
    const recipe = await prisma().recipe.findUnique({
      where: { id: Number(recipeId) },
      include: { ingredients: { include: { raw_material: true } } }
    });

    if (!recipe) {
      return { success: false, message: "Recipe not found" };
    }

    // 1. Calculate Total Recipe Cost
    let totalCost = 0;
    const costBreakdown = [];

    for (const ingredient of recipe.ingredients) {
      const quantity = parseFloat(ingredient.quantity || "0");
      const unitCost = getEffectiveUnitCost(ingredient);
      const ingredientCost = unitCost * quantity;
      totalCost += ingredientCost;

      costBreakdown.push({
        materialId: ingredient.raw_material.id,
        materialName: ingredient.raw_material.name,
        quantity,
        unit: ingredient.unit,
        baseUnit: ingredient.baseUnit,
        unitCost,
        totalCost: ingredientCost,
        percentage: 0
      });
    }

    // Calculate percentages
    costBreakdown.forEach(item => {
      item.percentage = totalCost > 0 ? parseFloat(((item.totalCost / totalCost) * 100).toFixed(2)) : 0;
    });

    // 2. Serving Cost = Total Cost (no division)
    const servingCost = totalCost;

    const [updatedRecipe] = await prisma().$transaction([
      prisma().recipe.update({
        where: { id: Number(recipeId) },
        data: {
          serving_cost: parseFloat(servingCost.toFixed(2)), // Stores total cost as serving cost
          updated_at: new Date()
        }
      }),
      ...recipe.ingredients.map(ingredient =>
        prisma().recipeIngredient.update({
          where: { id: ingredient.id },
          data: {
            cost_per_unit: getEffectiveUnitCost(ingredient),
            updated_at: new Date()
          }
        })
      )
    ]);

    return {
      success: true,
      data: {
        ...updatedRecipe,
        costAnalysis: {
          totalCost: parseFloat(totalCost.toFixed(2)),
          perServingCost: parseFloat(servingCost.toFixed(2)), // Same as totalCost
          breakdown: costBreakdown
        }
      }
    };
  } catch (error) {
    logger.error("Error calculating recipe cost:", error);
    return { success: false, message: error.message || "Failed to calculate recipe cost" };
  }
};

/**
 * Get all recipes with cost analysis
 */
export const getRecipes = async (filters = {}) => {
  try {
    const { category } = filters;
    const is_active = filters.is_active === "true" || filters.is_active === true;
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;

    const where = {};
    if (category) where.category = category;
    if (typeof filters.is_active !== "undefined") where.is_active = is_active;

    const [recipes, total] = await Promise.all([
      prisma().recipe.findMany({
        where,
        include: {
          ingredients: { include: { raw_material: true } },
          menu_items: { select: { id: true, name: true, selling_price: true } },
          creator: {
            select: { id: true, username: true, first_name: true, last_name: true }
          }
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma().recipe.count({ where })
    ]);

    const recipesWithAnalysis = await Promise.all(
      recipes.map(async recipe => {
        let totalCost = 0;
        const costBreakdown = recipe.ingredients.map(ingredient => {
          const quantity = parseFloat(ingredient.quantity);
          const unitCost = getEffectiveUnitCost(ingredient);
          const ingredientCost = unitCost * quantity;

          totalCost += ingredientCost;

          return {
            materialName: ingredient.raw_material.name,
            quantity,
            unit: ingredient.unit,
            baseUnit: ingredient.baseUnit,
            unitCost,
            totalCost: ingredientCost
          };
        });

        // If recipe doesn't have serving_cost calculated yet, calculate and update it
        if (!recipe.serving_cost) {
          const roundedTotalCost = parseFloat(totalCost.toFixed(2));
          await prisma().recipe.update({
            where: { id: recipe.id },
            data: { serving_cost: roundedTotalCost }
          });
          recipe.serving_cost = roundedTotalCost.toString();
        }

        return {
          ...recipe,
          costAnalysis: {
            totalCost,
            breakdown: costBreakdown
          }
        };
      })
    );

    return {
      success: true,
      data: {
        recipes: recipesWithAnalysis,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    logger.error("Error fetching recipes:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Create menu item with recipe link
 */
export const createMenuItem = async menuData => {
  try {
    let costPrice = parseFloat(menuData.cost_price || 0);

    // If linked to recipe, calculate cost from recipe
    if (menuData.recipe_id) {
      const recipeCost = await calculateRecipeCost(menuData.recipe_id);
      if (recipeCost.success) {
        costPrice = recipeCost.data.costAnalysis.costPerServing;
      }
    }

    const sellingPrice = parseFloat(menuData.selling_price);
    const marginAmount = sellingPrice - costPrice;
    const marginPercentage = costPrice > 0 ? (marginAmount / costPrice) * 100 : 0;

    const menuItem = await prisma().menuItem.create({
      data: {
        ...menuData,
        recipe_id: menuData.recipe_id ? parseInt(menuData.recipe_id) : null,
        cost_price: costPrice,
        selling_price: sellingPrice,
        margin_amount: marginAmount
      },
      include: { recipe: { include: { ingredients: { include: { raw_material: true } } } } }
    });

    logger.info(`Menu item created: ${menuItem.name}`);

    return {
      success: true,
      data: menuItem,
      message: "Menu item created successfully"
    };
  } catch (error) {
    logger.error("Error creating menu item:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

export const deleteRecipe = async id => {
  try {
    const recipeId = parseInt(id);

    return await prisma().$transaction(async prisma => {
      const existing = await prisma.recipe.findUnique({ where: { id: recipeId } });
      if (!existing) {
        return { success: false, message: "Recipe not found" };
      }

      await prisma.sectionRecipe.deleteMany({ where: { recipe_id: recipeId } });
      await prisma.recipeIngredient.deleteMany({ where: { recipe_id: recipeId } });
      await prisma.recipe.delete({ where: { id: recipeId } });

      return {
        success: true,
        message: "Recipe deleted successfully"
      };
    });
  } catch (error) {
    logger.error("Error deleting recipe:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get menu engineering analysis (Boston Matrix)
 */
export const getMenuEngineering = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get sales data for menu items
    const salesData = await prisma().$queryRaw`
      SELECT 
        mi.id,
        mi.name,
        mi.category,
        mi.cost_price,
        mi.selling_price,
        mi.margin_amount,
        COALESCE(SUM(s.quantity), 0) as total_sold,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(SUM(s.quantity * mi.cost_price), 0) as total_cost
      FROM menu_items mi
      LEFT JOIN sales s ON mi.id = s.menu_item_id 
        AND s.sale_date >= ${startDate}
      WHERE mi.is_available = true
      GROUP BY mi.id, mi.name, mi.category, mi.cost_price, mi.selling_price, mi.margin_amount
    `;

    if (salesData.length === 0) {
      return {
        success: true,
        data: {
          menuItems: [],
          analysis: {
            stars: [],
            plowhorses: [],
            puzzles: [],
            dogs: []
          },
          summary: {
            totalItems: 0,
            totalRevenue: 0,
            averageMargin: 0
          }
        }
      };
    }

    // Calculate averages for classification
    const totalSales = salesData.reduce((sum, item) => sum + parseInt(item.total_sold), 0);
    const averageSales = totalSales / salesData.length;
    const averageMargin = salesData.reduce((sum, item) => sum + parseFloat(item.margin_amount), 0) / salesData.length;

    // Classify menu items using Boston Matrix
    const menuAnalysis = {
      stars: [], // High sales, high margin
      plowhorses: [], // High sales, low margin
      puzzles: [], // Low sales, high margin
      dogs: [] // Low sales, low margin
    };

    const menuItems = salesData.map(item => {
      const itemData = {
        id: item.id,
        name: item.name,
        category: item.category,
        costPrice: parseFloat(item.cost_price),
        sellingPrice: parseFloat(item.selling_price),
        marginAmount: parseFloat(item.margin_amount),
        totalSold: parseInt(item.total_sold),
        totalRevenue: parseFloat(item.total_revenue),
        totalCost: parseFloat(item.total_cost),
        profitContribution: parseFloat(item.total_revenue) - parseFloat(item.total_cost),
        isHighSales: parseInt(item.total_sold) >= averageSales,
        isHighMargin: parseFloat(item.margin_amount) >= averageMargin
      };

      // Classify item
      if (itemData.isHighSales && itemData.isHighMargin) {
        itemData.classification = "STAR";
        menuAnalysis.stars.push(itemData);
      } else if (itemData.isHighSales && !itemData.isHighMargin) {
        itemData.classification = "PLOWHORSE";
        menuAnalysis.plowhorses.push(itemData);
      } else if (!itemData.isHighSales && itemData.isHighMargin) {
        itemData.classification = "PUZZLE";
        menuAnalysis.puzzles.push(itemData);
      } else {
        itemData.classification = "DOG";
        menuAnalysis.dogs.push(itemData);
      }

      return itemData;
    });

    // Sort categories by profit contribution
    Object.keys(menuAnalysis).forEach(key => {
      menuAnalysis[key].sort((a, b) => b.profitContribution - a.profitContribution);
    });

    const totalRevenue = salesData.reduce((sum, item) => sum + parseFloat(item.total_revenue), 0);

    return {
      success: true,
      data: {
        menuItems,
        analysis: menuAnalysis,
        summary: {
          totalItems: salesData.length,
          totalRevenue,
          averageMargin,
          averageSales,
          recommendations: generateMenuRecommendations(menuAnalysis)
        }
      }
    };
  } catch (error) {
    logger.error("Error getting menu engineering analysis:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Generate menu recommendations based on Boston Matrix
 */
const generateMenuRecommendations = analysis => {
  const recommendations = [];

  // Stars - maintain and promote
  if (analysis.stars.length > 0) {
    recommendations.push({
      category: "STARS",
      action: "MAINTAIN",
      priority: "HIGH",
      description: `Maintain quality and promote these ${analysis.stars.length} high-performing items. Consider featuring them prominently.`,
      items: analysis.stars.slice(0, 3).map(item => item.name)
    });
  }

  // Plowhorses - increase prices or reduce costs
  if (analysis.plowhorses.length > 0) {
    recommendations.push({
      category: "PLOWHORSES",
      action: "OPTIMIZE_MARGIN",
      priority: "MEDIUM",
      description: `These ${analysis.plowhorses.length} items sell well but have low margins. Consider increasing prices or reducing costs.`,
      items: analysis.plowhorses.slice(0, 3).map(item => item.name)
    });
  }

  // Puzzles - promote or reposition
  if (analysis.puzzles.length > 0) {
    recommendations.push({
      category: "PUZZLES",
      action: "PROMOTE",
      priority: "MEDIUM",
      description: `These ${analysis.puzzles.length} items have good margins but low sales. Consider better positioning or promotion.`,
      items: analysis.puzzles.slice(0, 3).map(item => item.name)
    });
  }

  // Dogs - consider removal or major changes
  if (analysis.dogs.length > 0) {
    recommendations.push({
      category: "DOGS",
      action: "REVIEW",
      priority: "LOW",
      description: `Consider removing or significantly changing these ${analysis.dogs.length} underperforming items.`,
      items: analysis.dogs.slice(0, 3).map(item => item.name)
    });
  }

  return recommendations;
};

/**
 * Get recipe cost variance analysis
 */
export const getRecipeCostVariance = async (recipeId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get historical cost data
    const recipe = await prisma().recipe.findUnique({
      where: { id: parseInt(recipeId) },
      include: {
        ingredients: {
          include: {
            raw_material: {
              include: {
                stock_entries: {
                  where: {
                    received_date: { gte: startDate }
                  },
                  orderBy: { received_date: "desc" }
                }
              }
            }
          }
        }
      }
    });

    if (!recipe) {
      return {
        success: false,
        message: "Recipe not found"
      };
    }

    // Calculate cost variance for each ingredient
    const varianceAnalysis = recipe.ingredients.map(ingredient => {
      const material = ingredient.raw_material;
      const stockEntries = material.stock_entries;

      const currentUnitCost = getEffectiveUnitCost(ingredient);
      const quantity = parseFloat(ingredient.quantity);

      let priceHistory = [];
      let averageHistoricalCost = currentUnitCost;

      if (stockEntries.length > 0) {
        priceHistory = stockEntries.map(entry => ({
          date: entry.received_date,
          unitCost: parseFloat(entry.unit_cost)
        }));

        averageHistoricalCost = stockEntries.reduce((sum, entry) => sum + parseFloat(entry.unit_cost), 0) / stockEntries.length;
      }

      const costVariance = currentUnitCost - averageHistoricalCost;
      const variancePercentage = averageHistoricalCost > 0 ? (costVariance / averageHistoricalCost) * 100 : 0;

      return {
        materialId: material.id,
        materialName: material.name,
        quantity,
        currentUnitCost,
        averageHistoricalCost,
        costVariance,
        variancePercentage,
        currentIngredientCost: currentUnitCost * quantity,
        historicalIngredientCost: averageHistoricalCost * quantity,
        priceHistory: priceHistory.slice(0, 10)
      };
    });

    const totalCurrentCost = varianceAnalysis.reduce((sum, item) => sum + item.currentIngredientCost, 0);
    const totalHistoricalCost = varianceAnalysis.reduce((sum, item) => sum + item.historicalIngredientCost, 0);

    const totalVariance = totalCurrentCost - totalHistoricalCost;
    const totalVariancePercentage = totalHistoricalCost > 0 ? (totalVariance / totalHistoricalCost) * 100 : 0;

    return {
      success: true,
      data: {
        recipe: {
          id: recipe.id,
          name: recipe.name,
          currentCostPerServing: totalCurrentCost,
          historicalCostPerServing: totalHistoricalCost
        },
        variance: {
          totalCurrentCost,
          totalHistoricalCost,
          totalVariance,
          totalVariancePercentage,
          status: totalVariance > 0 ? "INCREASED" : totalVariance < 0 ? "DECREASED" : "STABLE"
        },
        ingredients: varianceAnalysis
      }
    };
  } catch (error) {
    logger.error("Error getting recipe cost variance:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";
import * as stockService from "./stockService.js";

/**
 * Helper function to format section data for frontend
 */
const formatSectionForFrontend = section => ({
  id: section.id,
  name: section.name,
  description: section.description,
  type: section.type,
  managerId: section.manager_id,
  isActive: section.is_active,
  createdAt: section.created_at,
  updatedAt: section.updated_at,
  manager: section.manager ? formatUserForFrontend(section.manager) : null
});

/**
 * Helper function to format section inventory data for frontend
 */
const formatSectionInventoryForFrontend = inventory => ({
  id: inventory.id,
  sectionId: inventory.section_id,
  rawMaterialId: inventory.raw_material_id,
  quantity: parseFloat(inventory.quantity.toString()),
  reservedQuantity: parseFloat(inventory.reserved_quantity.toString()),
  minLevel: inventory.min_level ? parseFloat(inventory.min_level.toString()) : null,
  maxLevel: inventory.max_level ? parseFloat(inventory.max_level.toString()) : null,
  lastUpdated: inventory.last_updated,
  createdAt: inventory.created_at,
  updatedAt: inventory.updated_at,
  section: inventory.section ? formatSectionForFrontend(inventory.section) : null,
  rawMaterial: inventory.raw_material ? formatRawMaterialForFrontend(inventory.raw_material) : null
});

/**
 * Helper function to format section consumption data for frontend
 */
const formatSectionConsumptionForFrontend = consumption => ({
  id: consumption.id,
  sectionId: consumption.section_id,
  rawMaterialId: consumption.raw_material_id,
  quantity: parseFloat(consumption.quantity.toString()),
  consumedDate: consumption.consumed_date,
  consumedBy: consumption.user ? formatUserForFrontend(consumption.user) : null,
  reason: consumption.reason,
  orderId: consumption.order_id,
  notes: consumption.notes,
  createdAt: consumption.created_at,
  updatedAt: consumption.updated_at,
  section: consumption.section ? formatSectionForFrontend(consumption.section) : null,
  rawMaterial: consumption.raw_material ? formatRawMaterialForFrontend(consumption.raw_material) : null,
  user: consumption.user ? formatUserForFrontend(consumption.user) : null
});

/**
 * Helper function to format raw material data for frontend
 */
const formatRawMaterialForFrontend = material => ({
  id: material.id,
  name: material.name,
  description: material.description,
  category: material.category,
  unit: material.unit,
  unitCost: parseFloat(material.unit_cost.toString()),
  supplier: material.supplier,
  minStockLevel: parseFloat(material.min_stock_level.toString()),
  maxStockLevel: parseFloat(material.max_stock_level.toString()),
  isActive: material.is_active,
  unitsPerPack: material.units_per_pack,
  baseUnit: material.base_unit,
  createdAt: material.created_at,
  updatedAt: material.updated_at
});

/**
 * Helper function to format user data for frontend
 */
const formatUserForFrontend = user => ({
  id: user.id,
  username: user.username,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  displayName: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.username,
  role: user.role,
  isActive: user.is_active
});

/**
 * Helper function to get pack information from raw material
 */
const getPackInfo = rawMaterial => {
  const isPackOrBox = rawMaterial.unit === "PACKS" || rawMaterial.unit === "BOXES";
  if (!isPackOrBox) return null;

  return {
    unitsPerPack: rawMaterial.units_per_pack || 1,
    baseUnit: rawMaterial.base_unit || "PIECES",
    packUnit: rawMaterial.unit
  };
};

/**
 * Helper function to convert pack quantity to base units
 */
const convertPackToBase = (quantity, rawMaterial) => {
  const packInfo = getPackInfo(rawMaterial);
  if (!packInfo) return quantity;
  return quantity * packInfo.unitsPerPack;
};

/**
 * Helper function to convert base units to pack quantity
 */
const convertBaseToPack = (baseQuantity, rawMaterial) => {
  const packInfo = getPackInfo(rawMaterial);
  if (!packInfo) return baseQuantity;
  return parseFloat((baseQuantity / packInfo.unitsPerPack).toFixed(1));
};

/**
 * Create a new section
 */
export const createSection = async sectionData => {
  try {
    logger.info("Creating section:", sectionData.name);

    // Map frontend data to database format
    const dbData = {
      name: sectionData.name,
      description: sectionData.description,
      type: sectionData.type,
      manager_id: parseInt(sectionData.managerId, 10),
      is_active: true
    };

    const section = await prisma().section.create({
      data: dbData,
      include: {
        manager: true
      }
    });

    logger.info("Section created successfully:", section.id);

    return {
      data: formatSectionForFrontend(section),
      success: true,
      message: "Section created successfully"
    };
  } catch (error) {
    logger.error("Error in createSection service:", error);
    return {
      data: null,
      success: false,
      message: error.message || "Failed to create section"
    };
  }
};

/**
 * Get all sections with filtering
 */
export const getAllSections = async (filters = {}) => {
  try {
    logger.info("Fetching sections with filters:", filters);

    const where = {};

    if (filters.isActive !== undefined) {
      where.is_active = filters.isActive;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.managerId) {
      where.manager_id = filters.managerId;
    }

    const sections = await prisma().section.findMany({
      where,
      include: {
        manager: true
      },
      orderBy: {
        name: "asc"
      }
    });

    return {
      data: sections.map(formatSectionForFrontend),
      success: true
    };
  } catch (error) {
    logger.error("Error in getAllSections service:", error);
    throw new Error("Failed to retrieve sections");
  }
};

/**
 * Get section by ID
 */
export const getSectionById = async id => {
  try {
    if (!id) {
      throw new Error("Section ID is required");
    }

    logger.info("Fetching section by ID:", id);

    const section = await prisma().section.findUnique({
      where: { id },
      include: {
        manager: true
      }
    });

    if (!section) {
      return {
        data: null,
        success: true
      };
    }

    return {
      data: formatSectionForFrontend(section),
      success: true
    };
  } catch (error) {
    logger.error("Error in getSectionById service:", error);
    throw new Error("Failed to retrieve section");
  }
};

/**
 * Update section
 */
export const updateSection = async updateData => {
  try {
    const { id, ...data } = updateData;

    if (!id) {
      throw new Error("Section ID is required");
    }

    logger.info("Updating section:", id);

    // Map frontend data to database format
    const dbData = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.description !== undefined) dbData.description = data.description;
    if (data.type !== undefined) dbData.type = data.type;
    if (data.managerId !== undefined) dbData.manager_id = parseInt(data.managerId, 10);
    if (data.isActive !== undefined) dbData.is_active = data.isActive;

    const section = await prisma().section.update({
      where: { id },
      data: dbData,
      include: {
        manager: true
      }
    });

    logger.info("Section updated successfully:", id);

    return {
      data: formatSectionForFrontend(section),
      success: true,
      message: "Section updated successfully"
    };
  } catch (error) {
    logger.error("Error in updateSection service:", error);
    return {
      data: null,
      success: false,
      message: error.message || "Failed to update section"
    };
  }
};

/**
 * Delete section (soft delete)
 */
export const deleteSection = async id => {
  try {
    if (!id) {
      throw new Error("Section ID is required");
    }

    logger.info("Deleting section:", id);

    await prisma().section.update({
      where: { id },
      data: { is_active: false }
    });

    logger.info("Section deleted successfully:", id);

    return {
      data: true,
      success: true,
      message: "Section deleted successfully"
    };
  } catch (error) {
    logger.error("Error in deleteSection service:", error);
    return {
      data: false,
      success: false,
      message: error.message || "Failed to delete section"
    };
  }
};

/**
 * Assign stock to section with pack/box handling
 */
export const assignStockToSection = async assignmentData => {
  try {
    const { sectionId, rawMaterialId, quantity, assignedBy, notes } = assignmentData;

    logger.info("Assigning stock to section:", { sectionId, rawMaterialId, quantity });

    // Get raw material info for pack conversion
    const rawMaterial = await prisma().rawMaterial.findUnique({
      where: { id: parseInt(rawMaterialId, 10) }
    });

    if (!rawMaterial) {
      throw new Error("Raw material not found");
    }

    // Convert pack quantity to base units if needed
    const baseQuantityToAssign = convertPackToBase(quantity, rawMaterial);

    // Check if we have enough stock available
    const stockLevel = await stockService.getStockLevel(parseInt(rawMaterialId, 10));
    if (!stockLevel.success || !stockLevel.data) {
      throw new Error("Unable to check stock availability");
    }

    if (stockLevel.data.availableQuantity < baseQuantityToAssign) {
      const packInfo = getPackInfo(rawMaterial);
      const availablePacks = packInfo ? convertBaseToPack(stockLevel.data.availableQuantity, rawMaterial) : stockLevel.data.availableQuantity;
      const requestedPacks = packInfo ? quantity : baseQuantityToAssign;

      throw new Error(packInfo ? `Insufficient stock available. Requested: ${requestedPacks.toFixed(1)} ${rawMaterial.unit}, Available: ${availablePacks.toFixed(1)} ${rawMaterial.unit}` : `Insufficient stock available. Requested: ${baseQuantityToAssign}, Available: ${stockLevel.data.availableQuantity}`);
    }

    // Find an available stock entry to reference for the movement
    const stockEntries = await prisma().stockEntry.findMany({
      where: { raw_material_id: parseInt(rawMaterialId, 10) }
    });

    let stockEntryId = "";
    for (const entry of stockEntries) {
      const entryMovements = await prisma().stockMovement.findMany({
        where: { stock_entry_id: entry.id, type: "OUT" }
      });
      const usedQuantity = entryMovements.reduce((sum, movement) => sum + parseFloat(movement.quantity.toString()), 0);
      const availableQuantity = parseFloat(entry.quantity.toString()) - usedQuantity;

      if (availableQuantity > 0) {
        stockEntryId = entry.id;
        break;
      }
    }

    if (!stockEntryId) {
      throw new Error("No available stock entries found for this material");
    }

    // Check if section inventory entry exists
    const existingInventory = await prisma().sectionInventory.findFirst({
      where: { section_id: parseInt(sectionId, 10), raw_material_id: parseInt(rawMaterialId, 10) }
    });

    if (existingInventory) {
      // Update existing inventory (always store in base units)
      await prisma().sectionInventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: new Decimal(parseFloat(existingInventory.quantity.toString()) + baseQuantityToAssign),
          last_updated: new Date()
        }
      });
    } else {
      // Create new inventory entry (store in base units)
      await prisma().sectionInventory.create({
        data: {
          section_id: parseInt(sectionId, 10),
          raw_material_id: parseInt(rawMaterialId, 10),
          quantity: new Decimal(baseQuantityToAssign),
          reserved_quantity: new Decimal(0),
          last_updated: new Date()
        }
      });
    }

    // Create stock movement to track the assignment
    const packInfo = getPackInfo(rawMaterial);
    const movementNotes = packInfo ? `${notes || "Stock assigned to section"} (${quantity.toFixed(1)} ${rawMaterial.unit} = ${baseQuantityToAssign} ${packInfo.baseUnit})` : notes || "Stock assigned to section";

    await stockService.createStockMovement({
      stockEntryId,
      type: "TRANSFER",
      quantity: baseQuantityToAssign,
      toSectionId: parseInt(sectionId, 10),
      reason: movementNotes,
      performedBy: parseInt(assignedBy, 10)
    });

    // Get user information for response
    const assignedByUser = await prisma().user.findUnique({
      where: { id: parseInt(assignedBy, 10) }
    });

    // Get raw material information for response
    const assignmentDetails = {
      sectionId: parseInt(sectionId, 10),
      rawMaterialId: parseInt(rawMaterialId, 10),
      quantity: quantity,
      baseQuantity: baseQuantityToAssign,
      assignedBy: assignedByUser ? formatUserForFrontend(assignedByUser) : null,
      rawMaterial: formatRawMaterialForFrontend(rawMaterial),
      notes: notes,
      assignedAt: new Date()
    };

    return {
      data: assignmentDetails,
      success: true,
      message: "Stock assigned to section successfully"
    };
  } catch (error) {
    logger.error("Error in assignStockToSection service:", error);
    return {
      data: false,
      success: false,
      message: error.message || "Failed to assign stock to section"
    };
  }
};

/**
 * Assign recipe to section
 */
export const assignRecipeToSection = async assignmentData => {
  try {
    const { sectionId, recipeId, assignedBy, notes } = assignmentData;

    logger.info("Assigning recipe to section:", { sectionId, recipeId });

    // Check if section exists
    const section = await prisma().section.findUnique({
      where: { id: parseInt(sectionId, 10) }
    });

    if (!section) {
      throw new Error("Section not found");
    }

    // Check if recipe exists and get its ingredients
    const recipe = await prisma().recipe.findUnique({
      where: { id: parseInt(recipeId, 10) },
      include: {
        ingredients: {
          include: {
            raw_material: true
          }
        }
      }
    });

    if (!recipe) {
      throw new Error("Recipe not found");
    }

    // Check if recipe is already assigned to this section
    const existingAssignment = await prisma().sectionRecipe.findFirst({
      where: {
        section_id: parseInt(sectionId, 10),
        recipe_id: parseInt(recipeId, 10)
      }
    });

    if (existingAssignment) {
      throw new Error("This recipe is already assigned to this section");
    }

    // Assign the recipe to the section
    const assignment = await prisma().sectionRecipe.create({
      data: {
        section_id: parseInt(sectionId, 10),
        recipe_id: parseInt(recipeId, 10),
        assigned_by: parseInt(assignedBy, 10),
        notes: notes,
        assigned_at: new Date()
      },
      include: {
        recipe: true,
        assigned_by_user: true
      }
    });

    // Get all required ingredients with their quantities
    const requiredIngredients = recipe.ingredients.map(ingredient => ({
      raw_material_id: ingredient.raw_material_id,
      quantity: parseFloat(ingredient.quantity.toString()),
      baseUnit: ingredient.baseUnit,
      raw_material: ingredient.raw_material
    }));

    // Check stock availability for all ingredients
    const stockChecks = await Promise.all(
      requiredIngredients.map(async ingredient => {
        const stockLevel = await stockService.getStockLevel(ingredient.raw_material_id);
        return {
          ...ingredient,
          available: stockLevel.success ? stockLevel.data.availableQuantity : 0
        };
      })
    );

    // Check for insufficient stock
    const insufficientStock = stockChecks.filter(item => item.available < item.quantity);

    if (insufficientStock.length > 0) {
      const insufficientItems = insufficientStock.map(item => ({
        raw_material_id: item.raw_material_id,
        name: item.raw_material?.name || "Unknown",
        required: item.quantity,
        available: item.available,
        unit: item.baseUnit
      }));

      return {
        data: {
          assignment: formatSectionRecipeAssignmentForFrontend(assignment),
          insufficientStock: insufficientItems,
          status: "PARTIAL"
        },
        success: true,
        message: "Recipe assigned but some ingredients have insufficient stock"
      };
    }

    // If all ingredients are available, optionally auto-assign them
    // (You might want to make this configurable via a parameter)
    const autoAssign = true;
    if (autoAssign) {
      await Promise.all(
        requiredIngredients.map(async ingredient => {
          await assignStockToSection({
            sectionId: parseInt(sectionId, 10),
            rawMaterialId: ingredient.raw_material_id,
            quantity: ingredient.quantity,
            assignedBy: parseInt(assignedBy, 10),
            notes: `Auto-assigned from recipe: ${recipe.name}`
          });
        })
      );
    }

    return {
      data: {
        assignment: formatSectionRecipeAssignmentForFrontend(assignment),
        status: "COMPLETE"
      },
      success: true,
      message: "Recipe assigned successfully"
    };
  } catch (error) {
    logger.error("Error in assignRecipeToSection service:", error);
    return {
      data: null,
      success: false,
      message: error.message || "Failed to assign recipe to section"
    };
  }
};

/**
 * Helper function to format section recipe assignment for frontend
 */
const formatSectionRecipeAssignmentForFrontend = assignment => ({
  id: assignment.id,
  sectionId: assignment.section_id,
  recipeId: assignment.recipe_id,
  assignedBy: assignment.assigned_by_user ? formatUserForFrontend(assignment.assigned_by_user) : null,
  assignedAt: assignment.assigned_at,
  notes: assignment.notes,
  recipe: assignment.recipe ? formatRecipeForFrontend(assignment.recipe) : null
});

/**
 * Helper function to format recipe for frontend
 */
const formatRecipeForFrontend = recipe => ({
  id: recipe.id,
  name: recipe.name,
  category: recipe.category,
  instructions: recipe.instructions,
  isActive: recipe.is_active,
  createdAt: recipe.created_at,
  updatedAt: recipe.updated_at
});

/**
 * Get section recipe assignments
 */
export const getSectionRecipeAssignments = async sectionId => {
  try {
    logger.info("Fetching recipe assignments for section:", sectionId);

    const assignments = await prisma().sectionRecipe.findMany({
      where: { section_id: parseInt(sectionId, 10) },
      include: {
        recipe: true,
        assigned_by_user: true
      },
      orderBy: {
        assigned_at: "desc"
      }
    });

    return {
      data: assignments.map(formatSectionRecipeAssignmentForFrontend),
      success: true
    };
  } catch (error) {
    logger.error("Error in getSectionRecipeAssignments service:", error);
    throw new Error("Failed to retrieve section recipe assignments");
  }
};

/**
 * Remove recipe assignment from section
 */
export const removeRecipeAssignment = async (assignmentId, removedBy, notes) => {
  try {
    logger.info("Removing recipe assignment:", assignmentId);

    // Get the assignment first
    const assignment = await prisma().sectionRecipe.findUnique({
      where: { id: assignmentId },
      include: {
        recipe: true
      }
    });

    if (!assignment) {
      throw new Error("Recipe assignment not found");
    }

    // Delete the assignment
    await prisma().sectionRecipe.delete({
      where: { id: assignmentId }
    });

    // Get user information for response
    const removedByUser = await prisma().user.findUnique({
      where: { id: parseInt(removedBy, 10) }
    });

    const removalDetails = {
      assignmentId: assignmentId,
      recipeId: assignment.recipe_id,
      sectionId: assignment.section_id,
      removedBy: removedByUser ? formatUserForFrontend(removedByUser) : null,
      recipe: assignment.recipe ? formatRecipeForFrontend(assignment.recipe) : null,
      notes: notes,
      removedAt: new Date()
    };

    return {
      data: removalDetails,
      success: true,
      message: "Recipe assignment removed successfully"
    };
  } catch (error) {
    logger.error("Error in removeRecipeAssignment service:", error);
    return {
      data: false,
      success: false,
      message: error.message || "Failed to remove recipe assignment"
    };
  }
};

/**
 * Get section inventory with pack information
 */
export const getSectionInventory = async sectionId => {
  try {
    logger.info("Fetching section inventory for:", sectionId);

    const inventory = await prisma().sectionInventory.findMany({
      where: { section_id: parseInt(sectionId) },
      include: {
        section: true,
        raw_material: true
      }
    });

    // Add pack information and assignment details for display purposes
    const inventoryWithPackInfo = await Promise.all(
      inventory.map(async item => {
        const formatted = formatSectionInventoryForFrontend(item);

        if (item.raw_material) {
          const packInfo = getPackInfo(item.raw_material);
          if (packInfo) {
            formatted.packQuantity = convertBaseToPack(formatted.quantity, item.raw_material);
            formatted.packInfo = packInfo;
          }
        }

        // Get the most recent assignment information from stock movements
        const recentMovement = await prisma().stockMovement.findFirst({
          where: {
            to_section_id: item.section_id,
            stock_entry: {
              raw_material_id: item.raw_material_id
            },
            type: "TRANSFER"
          },
          include: {
            user: true
          },
          orderBy: {
            created_at: "desc"
          }
        });

        if (recentMovement && recentMovement.user) {
          formatted.lastAssignedBy = formatUserForFrontend(recentMovement.user);
          formatted.lastAssignedAt = recentMovement.created_at;
        }

        return formatted;
      })
    );

    return {
      data: inventoryWithPackInfo,
      success: true
    };
  } catch (error) {
    logger.error("Error in getSectionInventory service:", error);
    throw new Error("Failed to retrieve section inventory");
  }
};

/**
 * Record consumption in section with pack/box handling
 */
export const recordSectionConsumption = async consumptionData => {
  try {
    const { sectionId, rawMaterialId, quantity, consumedBy, reason, orderId, notes } = consumptionData;

    logger.info("Recording consumption:", { sectionId, rawMaterialId, quantity });

    // Get section and raw material
    const section = await prisma().section.findUnique({
      where: { id: parseInt(sectionId, 10) }
    });

    const rawMaterial = await prisma().rawMaterial.findUnique({
      where: { id: parseInt(rawMaterialId, 10) }
    });

    if (!section) {
      throw new Error("Section not found");
    }

    if (!rawMaterial) {
      throw new Error("Raw material not found");
    }

    // Get current inventory
    const inventory = await prisma().sectionInventory.findFirst({
      where: { section_id: parseInt(sectionId, 10), raw_material_id: parseInt(rawMaterialId, 10) }
    });

    if (!inventory) {
      throw new Error("No inventory found for this material in the section");
    }

    // Check if we have enough stock (quantity is already in base units from frontend)
    const baseQuantityToConsume = quantity;
    const currentQuantity = parseFloat(inventory.quantity.toString());

    if (currentQuantity < baseQuantityToConsume) {
      throw new Error(`Insufficient stock. Available: ${currentQuantity}, Requested: ${baseQuantityToConsume}`);
    }

    // Update inventory (always store in base units)
    await prisma().sectionInventory.update({
      where: { id: inventory.id },
      data: {
        quantity: new Decimal(currentQuantity - baseQuantityToConsume),
        last_updated: new Date()
      }
    });

    // Create consumption record with pack info if applicable
    const packInfo = getPackInfo(rawMaterial);
    const consumptionNotes = packInfo ? `${notes || reason} (${convertBaseToPack(quantity, rawMaterial).toFixed(1)} ${rawMaterial.unit} = ${baseQuantityToConsume} ${packInfo.baseUnit})` : notes || reason;

    // Create consumption record
    const consumption = await prisma().sectionConsumption.create({
      data: {
        section_id: parseInt(sectionId, 10),
        raw_material_id: parseInt(rawMaterialId, 10),
        quantity: new Decimal(baseQuantityToConsume),
        consumed_by: parseInt(consumedBy, 10),
        consumed_date: new Date(),
        reason: consumptionNotes,
        order_id: orderId || null,
        notes: consumptionNotes
      },
      include: {
        section: true,
        raw_material: true,
        user: true
      }
    });

    // Create stock movement to track consumption for reports
    const stockEntries = await prisma().stockEntry.findMany({
      where: { raw_material_id: parseInt(rawMaterialId, 10) }
    });

    let stockEntryId = "";
    for (const entry of stockEntries) {
      const entryMovements = await prisma().stockMovement.findMany({
        where: { stock_entry_id: entry.id, type: "OUT" }
      });
      const usedQuantity = entryMovements.reduce((sum, movement) => sum + parseFloat(movement.quantity.toString()), 0);
      const availableQuantity = parseFloat(entry.quantity.toString()) - usedQuantity;

      if (availableQuantity > 0) {
        stockEntryId = entry.id;
        break;
      }
    }

    if (stockEntryId) {
      try {
        await stockService.createStockMovement({
          stockEntryId,
          type: "OUT",
          quantity: baseQuantityToConsume,
          fromSectionId: parseInt(sectionId, 10),
          reason: consumptionNotes,
          performedBy: parseInt(consumedBy, 10)
        });
      } catch (error) {
        logger.error("Failed to create stock movement for consumption:", error);
      }
    }

    // Create detailed response with user information
    const responseData = {
      ...formatSectionConsumptionForFrontend(consumption),
      consumedBy: consumption.user ? formatUserForFrontend(consumption.user) : null
    };

    return {
      data: responseData,
      success: true,
      message: "Consumption recorded successfully"
    };
  } catch (error) {
    logger.error("Error in recordSectionConsumption service:", error);
    return {
      data: null,
      success: false,
      message: error.message || "Failed to record consumption"
    };
  }
};

/**
 * Get section consumption history with pack information
 */
export const getSectionConsumption = async (sectionId, filters = {}) => {
  try {
    logger.info("Fetching section consumption for:", sectionId);

    const where = { section_id: parseInt(sectionId) };

    if (filters.rawMaterialId) {
      where.raw_material_id = parseInt(filters.rawMaterialId);
    }

    if (filters.fromDate || filters.toDate) {
      where.consumed_date = {};
      if (filters.fromDate) {
        where.consumed_date.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.consumed_date.lte = new Date(filters.toDate);
      }
    }

    const consumption = await prisma().sectionConsumption.findMany({
      where,
      include: {
        section: true,
        raw_material: true,
        user: true
      },
      orderBy: {
        consumed_date: "desc"
      }
    });

    // Add pack information for display purposes
    const consumptionWithPackInfo = consumption.map(item => {
      const formatted = formatSectionConsumptionForFrontend(item);

      if (item.raw_material) {
        const packInfo = getPackInfo(item.raw_material);
        if (packInfo) {
          formatted.packQuantity = convertBaseToPack(formatted.quantity, item.raw_material);
          formatted.packInfo = packInfo;
        }
      }

      return formatted;
    });

    return {
      data: consumptionWithPackInfo,
      success: true
    };
  } catch (error) {
    logger.error("Error in getSectionConsumption service:", error);
    throw new Error("Failed to retrieve section consumption");
  }
};

/**
 * Update section inventory assignment
 */
export const updateSectionInventory = async (inventoryId, quantity, updatedBy, notes) => {
  try {
    logger.info("Updating section inventory:", inventoryId);

    // Get the current inventory item
    const currentInventory = await prisma().sectionInventory.findUnique({
      where: { id: inventoryId },
      include: { raw_material: true }
    });

    if (!currentInventory) {
      throw new Error("Section inventory not found");
    }

    const rawMaterial = currentInventory.raw_material;
    if (!rawMaterial) {
      throw new Error("Raw material not found");
    }

    // Convert pack quantity to base units if needed
    const baseQuantityToAssign = convertPackToBase(quantity, rawMaterial);

    // Check if we have enough stock available (considering current assignment)
    const stockLevel = await stockService.getStockLevel(currentInventory.raw_material_id);
    if (!stockLevel.success || !stockLevel.data) {
      throw new Error("Unable to check stock availability");
    }

    // Calculate how much additional stock we need
    const currentQuantity = parseFloat(currentInventory.quantity.toString());
    const additionalNeeded = baseQuantityToAssign - currentQuantity;

    if (additionalNeeded > 0) {
      // We need more stock, check if available
      if (stockLevel.data.availableQuantity < additionalNeeded) {
        const packInfo = getPackInfo(rawMaterial);
        const availablePacks = packInfo ? convertBaseToPack(stockLevel.data.availableQuantity, rawMaterial) : stockLevel.data.availableQuantity;
        const requestedPacks = packInfo ? quantity : baseQuantityToAssign;

        throw new Error(packInfo ? `Insufficient stock available. Requested: ${requestedPacks.toFixed(1)} ${rawMaterial.unit}, Available: ${availablePacks.toFixed(1)} ${rawMaterial.unit}` : `Insufficient stock available. Requested: ${baseQuantityToAssign}, Available: ${stockLevel.data.availableQuantity}`);
      }
    }

    // Update the inventory
    await prisma().sectionInventory.update({
      where: { id: inventoryId },
      data: {
        quantity: new Decimal(baseQuantityToAssign),
        last_updated: new Date()
      }
    });

    // Create stock movement to track the change
    const packInfo = getPackInfo(rawMaterial);
    const movementNotes = packInfo ? `${notes || "Section inventory updated"} (${quantity.toFixed(1)} ${rawMaterial.unit} = ${baseQuantityToAssign} ${packInfo.baseUnit})` : notes || "Section inventory updated";

    // Find an available stock entry to reference for the movement
    const stockEntries = await prisma().stockEntry.findMany({
      where: { raw_material_id: currentInventory.raw_material_id }
    });

    let stockEntryId = "";
    for (const entry of stockEntries) {
      const entryMovements = await prisma().stockMovement.findMany({
        where: { stock_entry_id: entry.id, type: "OUT" }
      });
      const usedQuantity = entryMovements.reduce((sum, movement) => sum + parseFloat(movement.quantity.toString()), 0);
      const availableQuantity = parseFloat(entry.quantity.toString()) - usedQuantity;

      if (availableQuantity > 0) {
        stockEntryId = entry.id;
        break;
      }
    }

    if (stockEntryId && additionalNeeded !== 0) {
      await stockService.createStockMovement({
        stockEntryId,
        type: "TRANSFER",
        quantity: Math.abs(additionalNeeded),
        toSectionId: currentInventory.section_id,
        reason: movementNotes,
        performedBy: parseInt(updatedBy, 10)
      });
    }

    // Get user information for response
    const updatedByUser = await prisma().user.findUnique({
      where: { id: parseInt(updatedBy, 10) }
    });

    const updateDetails = {
      inventoryId: inventoryId,
      quantity: quantity,
      baseQuantity: baseQuantityToAssign,
      updatedBy: updatedByUser ? formatUserForFrontend(updatedByUser) : null,
      rawMaterial: formatRawMaterialForFrontend(rawMaterial),
      notes: notes,
      updatedAt: new Date()
    };

    return {
      data: updateDetails,
      success: true,
      message: "Section inventory updated successfully"
    };
  } catch (error) {
    logger.error("Error in updateSectionInventory service:", error);
    return {
      data: false,
      success: false,
      message: error.message || "Failed to update section inventory"
    };
  }
};

/**
 * Remove section inventory assignment
 */
export const removeSectionInventory = async (inventoryId, removedBy, notes) => {
  try {
    logger.info("Removing section inventory:", inventoryId);

    // Get the current inventory item
    const currentInventory = await prisma().sectionInventory.findUnique({
      where: { id: inventoryId },
      include: { raw_material: true }
    });

    if (!currentInventory) {
      throw new Error("Section inventory not found");
    }

    const rawMaterial = currentInventory.raw_material;
    if (!rawMaterial) {
      throw new Error("Raw material not found");
    }

    const currentQuantity = parseFloat(currentInventory.quantity.toString());

    // Delete the inventory item
    await prisma().sectionInventory.delete({
      where: { id: inventoryId }
    });

    // Create stock movement to track the removal
    const packInfo = getPackInfo(rawMaterial);
    const movementNotes = packInfo ? `${notes || "Stock removed from section"} (${convertBaseToPack(currentQuantity, rawMaterial).toFixed(1)} ${rawMaterial.unit} = ${currentQuantity} ${packInfo.baseUnit})` : notes || "Stock removed from section";

    // Find an available stock entry to reference for the movement
    const stockEntries = await prisma().stockEntry.findMany({
      where: { raw_material_id: currentInventory.raw_material_id }
    });

    let stockEntryId = "";
    for (const entry of stockEntries) {
      const entryMovements = await prisma().stockMovement.findMany({
        where: { stock_entry_id: entry.id, type: "OUT" }
      });
      const usedQuantity = entryMovements.reduce((sum, movement) => sum + parseFloat(movement.quantity.toString()), 0);
      const availableQuantity = parseFloat(entry.quantity.toString()) - usedQuantity;

      if (availableQuantity > 0) {
        stockEntryId = entry.id;
        break;
      }
    }

    if (stockEntryId) {
      await stockService.createStockMovement({
        stockEntryId,
        type: "TRANSFER",
        quantity: currentQuantity,
        fromSectionId: currentInventory.section_id,
        reason: movementNotes,
        performedBy: parseInt(removedBy, 10)
      });
    }

    // Get user information for response
    const removedByUser = await prisma().user.findUnique({
      where: { id: parseInt(removedBy, 10) }
    });

    const removalDetails = {
      inventoryId: inventoryId,
      quantity: currentQuantity,
      removedBy: removedByUser ? formatUserForFrontend(removedByUser) : null,
      rawMaterial: formatRawMaterialForFrontend(rawMaterial),
      notes: notes,
      removedAt: new Date()
    };

    return {
      data: removalDetails,
      success: true,
      message: "Section inventory removed successfully"
    };
  } catch (error) {
    logger.error("Error in removeSectionInventory service:", error);
    return {
      data: false,
      success: false,
      message: error.message || "Failed to remove section inventory"
    };
  }
};

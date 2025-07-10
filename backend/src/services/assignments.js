import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../config/prisma.js";
import { convertBaseToPack, convertPackToBase, formatRawMaterialForFrontend, formatRecipeForFrontend, formatSectionRecipeAssignmentForFrontend, formatUserForFrontend, getPackInfo } from "../utils/helpers.js";
import logger from "../utils/logger.js";
import * as stockService from "./stockService.js";

// Assign stock to section with pack/box handling
export const assignStockToSection = async assignmentData => {
  try {
    const { sectionId, rawMaterialId, quantity, assignedBy, notes } = assignmentData;
    logger.info("Assigning stock to section:", { sectionId, rawMaterialId, quantity });
    // Get raw material info for pack conversion
    const rawMaterial = await prisma().rawMaterial.findUnique({ where: { id: parseInt(rawMaterialId, 10) } });
    if (!rawMaterial) throw new Error("Raw material not found");
    // Convert pack quantity to base units if needed
    const baseQuantityToAssign = convertPackToBase(quantity, rawMaterial);
    // Check if we have enough stock available
    const stockLevel = await stockService.getStockLevel(parseInt(rawMaterialId, 10));
    if (!stockLevel.success || !stockLevel.data) throw new Error("Unable to check stock availability");
    if (stockLevel.data.availableUnitsQuantity < baseQuantityToAssign) {
      const packInfo = getPackInfo(rawMaterial);
      const availablePacks = packInfo ? convertBaseToPack(stockLevel.data.availableUnitsQuantity, rawMaterial) : stockLevel.data.availableUnitsQuantity;
      const requestedPacks = packInfo ? quantity : baseQuantityToAssign;
      throw new Error(packInfo ? `Insufficient stock available. Requested: ${requestedPacks.toFixed(1)} ${rawMaterial.unit}, Available: ${availablePacks.toFixed(1)} ${rawMaterial.unit}` : `Insufficient stock available. Requested: ${baseQuantityToAssign}, Available: ${stockLevel.data.availableUnitsQuantity}`);
    }
    // Find an available stock entry to reference for the movement
    const stockEntries = await prisma().stockEntry.findMany({ where: { raw_material_id: parseInt(rawMaterialId, 10) } });
    let stockEntryId = "";
    for (const entry of stockEntries) {
      const entryMovements = await prisma().stockMovement.findMany({ where: { stock_entry_id: entry.id, type: "OUT" } });
      const usedQuantity = entryMovements.reduce((sum, movement) => sum + parseFloat(movement.quantity.toString()), 0);
      const availableQuantity = parseFloat(entry.quantity.toString()) - usedQuantity;
      if (availableQuantity > 0) {
        stockEntryId = entry.id;
        break;
      }
    }
    if (!stockEntryId) throw new Error("No available stock entries found for this material");
    // Check if section inventory entry exists
    const existingInventory = await prisma().sectionInventory.findFirst({ where: { section_id: parseInt(sectionId, 10), raw_material_id: parseInt(rawMaterialId, 10) } });
    if (existingInventory) {
      // Update existing inventory (always store in base units)
      await prisma().sectionInventory.update({ where: { id: existingInventory.id }, data: { quantity: new Decimal(parseFloat(existingInventory.quantity.toString()) + baseQuantityToAssign), last_updated: new Date() } });
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
    return { data: assignmentDetails, success: true, message: "Stock assigned to section successfully" };
  } catch (error) {
    logger.error("Error in assignStockToSection service:", error);
    return { data: false, success: false, message: error.message || "Failed to assign stock to section" };
  }
};

// Assign recipe to section
export const assignRecipeToSection = async assignmentData => {
  try {
    const { sectionId, recipeId, assignedBy, notes } = assignmentData;
    logger.info("Assigning recipe to section:", { sectionId, recipeId });
    // Check if section exists
    const section = await prisma().section.findUnique({ where: { id: parseInt(sectionId, 10) } });
    if (!section) throw new Error("Section not found");
    // Check if recipe exists
    const recipe = await prisma().recipe.findUnique({ where: { id: parseInt(recipeId, 10) }, include: { ingredients: { include: { raw_material: true } } } });
    if (!recipe) throw new Error("Recipe not found");
    // Check if recipe is already assigned to this section
    const existingAssignment = await prisma().sectionRecipe.findFirst({ where: { section_id: parseInt(sectionId, 10), recipe_id: parseInt(recipeId, 10) } });
    if (existingAssignment) throw new Error("This recipe is already assigned to this section");
    // Assign the recipe to the section
    const assignment = await prisma().sectionRecipe.create({ data: { section_id: parseInt(sectionId, 10), recipe_id: parseInt(recipeId, 10), assigned_by: parseInt(assignedBy, 10), notes: notes, assigned_at: new Date() }, include: { recipe: true, assigned_by_user: true } });
    return { data: { assignment: formatSectionRecipeAssignmentForFrontend(assignment) }, success: true, message: "Recipe assigned successfully" };
  } catch (error) {
    logger.error("Error in assignRecipeToSection service:", error);
    return { data: null, success: false, message: error.message || "Failed to assign recipe to section" };
  }
};

// Get section recipe assignments
export const getSectionRecipeAssignments = async sectionId => {
  try {
    const assignments = await prisma().sectionRecipe.findMany({
      where: { section_id: parseInt(sectionId) },
      include: { recipe: { include: { ingredients: { include: { raw_material: true } } } }, assigned_by_user: true },
      orderBy: { assigned_at: "desc" }
    });
    return {
      data: assignments.map(formatSectionRecipeAssignmentForFrontend),
      success: true,
      message: "Section recipe assignments retrieved successfully"
    };
  } catch (error) {
    throw new Error("Failed to retrieve section recipe assignments");
  }
};

// Remove recipe assignment from section
export const removeRecipeAssignment = async (assignmentId, removedBy, notes) => {
  try {
    logger.info("Removing recipe assignment:", assignmentId);
    // Get the assignment first
    const assignment = await prisma().sectionRecipe.findUnique({ where: { id: assignmentId }, include: { recipe: true } });
    if (!assignment) throw new Error("Recipe assignment not found");
    // Delete the assignment
    await prisma().sectionRecipe.delete({ where: { id: assignmentId } });
    // Get user information for response
    const removedByUser = await prisma().user.findUnique({ where: { id: parseInt(removedBy, 10) } });
    const removalDetails = { assignmentId: assignmentId, recipeId: assignment.recipe_id, sectionId: assignment.section_id, removedBy: removedByUser ? formatUserForFrontend(removedByUser) : null, recipe: assignment.recipe ? formatRecipeForFrontend(assignment.recipe) : null, notes: notes, removedAt: new Date() };
    return { data: removalDetails, success: true, message: "Recipe assignment removed successfully" };
  } catch (error) {
    logger.error("Error in removeRecipeAssignment service:", error);
    return { data: false, success: false, message: error.message || "Failed to remove recipe assignment" };
  }
};

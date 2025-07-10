import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../config/prisma.js";
import { convertBaseToPack, convertPackToBase, formatRawMaterialForFrontend, formatSectionInventoryForFrontend, formatUserForFrontend, getPackInfo } from "../utils/helpers.js";
import logger from "../utils/logger.js";
import * as stockService from "./stockService.js";

/**
 * Get section inventory with pack information
 */
export const getSectionInventory = async sectionId => {
  try {
    logger.info("Fetching section inventory for:", sectionId);
    const inventory = await prisma().sectionInventory.findMany({ where: { section_id: parseInt(sectionId) }, include: { section: true, raw_material: true } });
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
        const recentMovement = await prisma().stockMovement.findFirst({ where: { to_section_id: item.section_id, stock_entry: { raw_material_id: item.raw_material_id }, type: "TRANSFER" }, include: { user: true }, orderBy: { created_at: "desc" } });
        if (recentMovement && recentMovement.user) {
          formatted.lastAssignedBy = formatUserForFrontend(recentMovement.user);
          formatted.lastAssignedAt = recentMovement.created_at;
        }
        return formatted;
      })
    );
    return { data: inventoryWithPackInfo, success: true, message: "Section inventory retrieved successfully" };
  } catch (error) {
    logger.error("Error in getSectionInventory service:", error);
    throw new Error("Failed to retrieve section inventory");
  }
};

// Update section inventory assignment
export const updateSectionInventory = async (inventoryId, quantity, updatedBy, notes) => {
  try {
    logger.info("Updating section inventory:", inventoryId);
    const currentInventory = await prisma().sectionInventory.findUnique({ where: { id: inventoryId }, include: { raw_material: true } });
    if (!currentInventory) {
      throw new Error("Section inventory not found");
    }
    const rawMaterial = currentInventory.raw_material;
    if (!rawMaterial) throw new Error("Raw material not found");
    const baseQuantityToAssign = convertPackToBase(quantity, rawMaterial);
    const stockLevel = await stockService.getStockLevel(currentInventory.raw_material_id);
    if (!stockLevel.success || !stockLevel.data) throw new Error("Unable to check stock availability");
    const currentQuantity = parseFloat(currentInventory.quantity.toString());
    const additionalNeeded = baseQuantityToAssign - currentQuantity;
    if (additionalNeeded > 0) {
      if (stockLevel.data.availableUnitsQuantity < additionalNeeded) {
        const packInfo = getPackInfo(rawMaterial);
        const availablePacks = packInfo ? convertBaseToPack(stockLevel.data.availableUnitsQuantity, rawMaterial) : stockLevel.data.availableUnitsQuantity;
        const requestedPacks = packInfo ? quantity : baseQuantityToAssign;
        throw new Error(packInfo ? `Insufficient stock available. Requested: ${requestedPacks.toFixed(1)} ${rawMaterial.unit}, Available: ${availablePacks.toFixed(1)} ${rawMaterial.unit}` : `Insufficient stock available. Requested: ${baseQuantityToAssign}, Available: ${stockLevel.data.availableUnitsQuantity}`);
      }
    }
    await prisma().sectionInventory.update({ where: { id: inventoryId }, data: { quantity: new Decimal(baseQuantityToAssign), last_updated: new Date() } });
    // Create stock movement to track the change
    const packInfo = getPackInfo(rawMaterial);
    const movementNotes = packInfo ? `${notes || "Section inventory updated"} (${quantity.toFixed(1)} ${rawMaterial.unit} = ${baseQuantityToAssign} ${packInfo.baseUnit})` : notes || "Section inventory updated";
    // Find an available stock entry to reference for the movement
    const stockEntries = await prisma().stockEntry.findMany({ where: { raw_material_id: currentInventory.raw_material_id } });
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
    const updatedByUser = await prisma().user.findUnique({ where: { id: parseInt(updatedBy, 10) } });
    const updateDetails = {
      inventoryId: inventoryId,
      quantity: quantity,
      baseQuantity: baseQuantityToAssign,
      updatedBy: updatedByUser ? formatUserForFrontend(updatedByUser) : null,
      rawMaterial: formatRawMaterialForFrontend(rawMaterial),
      notes,
      updatedAt: new Date()
    };
    return { data: updateDetails, success: true, message: "Section inventory updated successfully" };
  } catch (error) {
    logger.error("Error in updateSectionInventory service:", error);
    return { data: false, success: false, message: error.message || "Failed to update section inventory" };
  }
};

// Remove section inventory assignment
export const removeSectionInventory = async (inventoryId, removedBy, notes) => {
  try {
    logger.info("Removing section inventory:", inventoryId);
    // Get the current inventory item
    const currentInventory = await prisma().sectionInventory.findUnique({ where: { id: inventoryId }, include: { raw_material: true } });
    if (!currentInventory) throw new Error("Section inventory not found");
    const rawMaterial = currentInventory.raw_material;
    if (!rawMaterial) throw new Error("Raw material not found");
    const currentQuantity = parseFloat(currentInventory.quantity.toString());
    // Delete the inventory item
    await prisma().sectionInventory.delete({ where: { id: inventoryId } });
    // Create stock movement to track the removal
    const packInfo = getPackInfo(rawMaterial);
    const movementNotes = packInfo ? `${notes || "Stock removed from section"} (${convertBaseToPack(currentQuantity, rawMaterial).toFixed(1)} ${rawMaterial.unit} = ${currentQuantity} ${packInfo.baseUnit})` : notes || "Stock removed from section";
    // Find an available stock entry to reference for the movement
    const stockEntries = await prisma().stockEntry.findMany({ where: { raw_material_id: currentInventory.raw_material_id } });
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
    const removedByUser = await prisma().user.findUnique({ where: { id: parseInt(removedBy, 10) } });
    const removalDetails = {
      inventoryId,
      quantity: currentQuantity,
      removedBy: removedByUser ? formatUserForFrontend(removedByUser) : null,
      rawMaterial: formatRawMaterialForFrontend(rawMaterial),
      notes,
      removedAt: new Date()
    };
    return { data: removalDetails, success: true, message: "Section inventory removed successfully" };
  } catch (error) {
    logger.error("Error in removeSectionInventory service:", error);
    return { data: false, success: false, message: error.message || "Failed to remove section inventory" };
  }
};

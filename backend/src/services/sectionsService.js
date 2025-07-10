import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../config/prisma.js";
import { convertBaseToPack, formatSectionConsumptionForFrontend, formatSectionForFrontend, formatUserForFrontend, getPackInfo } from "../utils/helpers.js";
import logger from "../utils/logger.js";
import * as stockService from "./stockService.js";

// Create a new section
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
      include: { manager: true }
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

// Get all sections with filtering
export const getAllSections = async (filters = {}) => {
  try {
    logger.info("Fetching sections with filters:", filters);
    const where = {};
    if (filters.isActive !== undefined) where.is_active = filters.isActive;
    if (filters.type) where.type = filters.type;
    if (filters.managerId) where.manager_id = filters.managerId;
    const sections = await prisma().section.findMany({ where, include: { manager: true }, orderBy: { name: "asc" } });
    return { data: sections.map(formatSectionForFrontend), success: true };
  } catch (error) {
    logger.error("Error in getAllSections service:", error);
    throw new Error("Failed to retrieve sections");
  }
};

// Get section by ID
export const getSectionById = async id => {
  try {
    if (!id) throw new Error("Section ID is required");
    logger.info("Fetching section by ID:", id);
    const section = await prisma().section.findUnique({ where: { id }, include: { manager: true } });
    if (!section) return { data: null, success: true };
    return { data: formatSectionForFrontend(section), success: true };
  } catch (error) {
    logger.error("Error in getSectionById service:", error);
    throw new Error("Failed to retrieve section");
  }
};

// Update section
export const updateSection = async updateData => {
  try {
    const { id, ...data } = updateData;
    if (!id) throw new Error("Section ID is required");
    logger.info("Updating section:", id);
    // Map frontend data to database format
    const dbData = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.description !== undefined) dbData.description = data.description;
    if (data.type !== undefined) dbData.type = data.type;
    if (data.managerId !== undefined) dbData.manager_id = parseInt(data.managerId, 10);
    if (data.isActive !== undefined) dbData.is_active = data.isActive;
    const section = await prisma().section.update({ where: { id }, data: dbData, include: { manager: true } });
    logger.info("Section updated successfully:", id);
    return { data: formatSectionForFrontend(section), success: true, message: "Section updated successfully" };
  } catch (error) {
    logger.error("Error in updateSection service:", error);
    return { data: null, success: false, message: error.message || "Failed to update section" };
  }
};

// Delete section (soft delete)
export const deleteSection = async id => {
  try {
    if (!id) throw new Error("Section ID is required");
    logger.info("Deleting section:", id);
    await prisma().section.update({ where: { id }, data: { is_active: false } });
    logger.info("Section deleted successfully:", id);
    return { data: true, success: true, message: "Section deleted successfully" };
  } catch (error) {
    logger.error("Error in deleteSection service:", error);
    return { data: false, success: false, message: error.message || "Failed to delete section" };
  }
};

// Record consumption in section with pack/box handling
export const recordSectionConsumption = async consumptionData => {
  try {
    const { sectionId, rawMaterialId, quantity, consumedBy, reason, orderId, notes } = consumptionData;
    logger.info("Recording consumption:", { sectionId, rawMaterialId, quantity });
    // Get section and raw material
    const section = await prisma().section.findUnique({ where: { id: parseInt(sectionId, 10) } });
    const rawMaterial = await prisma().rawMaterial.findUnique({ where: { id: parseInt(rawMaterialId, 10) } });
    if (!section) throw new Error("Section not found");
    if (!rawMaterial) throw new Error("Raw material not found");
    // Get current inventory
    const inventory = await prisma().sectionInventory.findFirst({ where: { section_id: parseInt(sectionId, 10), raw_material_id: parseInt(rawMaterialId, 10) } });
    if (!inventory) throw new Error("No inventory found for this material in the section");
    // Check if we have enough stock (quantity is already in base units from frontend)
    const baseQuantityToConsume = quantity;
    const currentQuantity = parseFloat(inventory.quantity.toString());
    if (currentQuantity < baseQuantityToConsume) throw new Error(`Insufficient stock. Available: ${currentQuantity}, Requested: ${baseQuantityToConsume}`);
    // Update inventory (always store in base units)
    await prisma().sectionInventory.update({
      where: { id: inventory.id },
      data: { quantity: new Decimal(currentQuantity - baseQuantityToConsume), last_updated: new Date() }
    });
    // Create consumption record with pack info if applicable
    const packInfo = getPackInfo(rawMaterial);
    const consumptionNotes = packInfo ? `${notes || reason} (${convertBaseToPack(quantity, rawMaterial).toFixed(1)} ${rawMaterial.unit} = ${baseQuantityToConsume} ${packInfo.baseUnit})` : notes || reason;
    // Create consumption record
    const consumption = await prisma().sectionConsumption.create({
      data: { section_id: parseInt(sectionId, 10), raw_material_id: parseInt(rawMaterialId, 10), quantity: new Decimal(baseQuantityToConsume), consumed_by: parseInt(consumedBy, 10), consumed_date: new Date(), reason: consumptionNotes, order_id: orderId || null, notes: consumptionNotes },
      include: { section: true, raw_material: true, user: true }
    });
    // Create stock movement to track consumption for reports
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
    const responseData = { ...formatSectionConsumptionForFrontend(consumption), consumedBy: consumption.user ? formatUserForFrontend(consumption.user) : null };
    return { data: responseData, success: true, message: "Consumption recorded successfully" };
  } catch (error) {
    logger.error("Error in recordSectionConsumption service:", error);
    return { data: null, success: false, message: error.message || "Failed to record consumption" };
  }
};

// Get section consumption history with pack information
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
    const consumption = await prisma().sectionConsumption.findMany({ where, include: { section: true, raw_material: true, user: true }, orderBy: { consumed_date: "desc" } });
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
    return { data: consumptionWithPackInfo, success: true, message: "Section consumption retrieved successfully" };
  } catch (error) {
    logger.error("Error in getSectionConsumption service:", error);
    throw new Error("Failed to retrieve section consumption");
  }
};

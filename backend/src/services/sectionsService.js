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
  consumedBy: consumption.consumed_by,
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
  name: user.name,
  email: user.email,
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
  return baseQuantity / packInfo.unitsPerPack;
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
      manager_id: sectionData.managerId,
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
    if (data.managerId !== undefined) dbData.manager_id = data.managerId;
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
      where: { id: rawMaterialId }
    });

    if (!rawMaterial) {
      throw new Error("Raw material not found");
    }

    // Convert pack quantity to base units if needed
    const baseQuantityToAssign = convertPackToBase(quantity, rawMaterial);

    // Check if we have enough stock available
    const stockLevel = await stockService.getStockLevel(rawMaterialId);
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
      where: { raw_material_id: rawMaterialId }
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
      where: { section_id: sectionId, raw_material_id: rawMaterialId }
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
          section_id: sectionId,
          raw_material_id: rawMaterialId,
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
      toSectionId: sectionId,
      reason: movementNotes,
      performedBy: assignedBy
    });

    return {
      data: true,
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
 * Get section inventory with pack information
 */
export const getSectionInventory = async sectionId => {
  try {
    logger.info("Fetching section inventory for:", sectionId);

    const inventory = await prisma().sectionInventory.findMany({
      where: { section_id: sectionId },
      include: {
        section: true,
        raw_material: true
      }
    });

    // Add pack information for display purposes
    const inventoryWithPackInfo = inventory.map(item => {
      const formatted = formatSectionInventoryForFrontend(item);

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
      where: { id: sectionId }
    });

    const rawMaterial = await prisma().rawMaterial.findUnique({
      where: { id: rawMaterialId }
    });

    if (!section) {
      throw new Error("Section not found");
    }

    if (!rawMaterial) {
      throw new Error("Raw material not found");
    }

    // Get current inventory
    const inventory = await prisma().sectionInventory.findFirst({
      where: { section_id: sectionId, raw_material_id: rawMaterialId }
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
        section_id: sectionId,
        raw_material_id: rawMaterialId,
        quantity: new Decimal(baseQuantityToConsume),
        consumed_by: consumedBy,
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
      where: { raw_material_id: rawMaterialId }
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
          fromSectionId: sectionId,
          reason: consumptionNotes,
          performedBy: consumedBy
        });
      } catch (error) {
        logger.error("Failed to create stock movement for consumption:", error);
      }
    }

    return {
      data: formatSectionConsumptionForFrontend(consumption),
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

    const where = { section_id: sectionId };

    if (filters.rawMaterialId) {
      where.raw_material_id = filters.rawMaterialId;
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
        performedBy: updatedBy
      });
    }

    return {
      data: true,
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
        performedBy: removedBy
      });
    }

    return {
      data: true,
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

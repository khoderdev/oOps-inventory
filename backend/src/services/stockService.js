import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";
import { generateNextOrderId } from "../utils/orderId.js";

/**
 * Helper function to format user data for frontend
 */
const formatUserForFrontend = user => ({
  id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  role: user.role,
  isActive: user.is_active
});

/**
 * Helper function to format stock entry data for frontend
 */
const formatStockEntryForFrontend = entry => ({
  id: entry.id,
  rawMaterialId: entry.raw_material_id,
  quantity: parseFloat(entry.quantity.toString()),
  unitCost: parseFloat(entry.unit_cost.toString()),
  totalCost: parseFloat(entry.total_cost.toString()),
  supplier: entry.supplier,
  batchNumber: entry.batch_number,
  expiryDate: entry.expiry_date,
  receivedDate: entry.received_date,
  receivedBy: entry.received_by,
  notes: entry.notes,
  createdAt: entry.created_at,
  updatedAt: entry.updated_at,
  rawMaterial: entry.raw_material ? formatRawMaterialForFrontend(entry.raw_material) : null,
  user: entry.user ? formatUserForFrontend(entry.user) : null
});

/**
 * Helper function to format stock movement data for frontend
 */
const formatStockMovementForFrontend = movement => ({
  id: movement.id,
  stockEntryId: movement.stock_entry_id,
  type: movement.type,
  quantity: parseFloat(movement.quantity.toString()),
  fromSectionId: movement.from_section_id,
  toSectionId: movement.to_section_id,
  reason: movement.reason,
  performedBy: movement.performed_by,
  referenceId: movement.reference_id,
  createdAt: movement.created_at,
  updatedAt: movement.updated_at,
  stockEntry: movement.stock_entry ? formatStockEntryForFrontend(movement.stock_entry) : null,
  fromSection: movement.from_section ? formatSectionForFrontend(movement.from_section) : null,
  toSection: movement.to_section ? formatSectionForFrontend(movement.to_section) : null,
  user: movement.user ? formatUserForFrontend(movement.user) : null
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
  updatedAt: section.updated_at
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
 * Create a new stock entry with pack/box handling
 */
export const createStockEntry = async entryData => {
  try {
    logger.info("Creating stock entry for material:", entryData.rawMaterialId);

    // Get raw material to understand pack structure
    const rawMaterial = await prisma().rawMaterial.findUnique({
      where: { id: entryData.rawMaterialId }
    });

    if (!rawMaterial) {
      throw new Error("Raw material not found");
    }

    // Convert pack quantity to base units if needed
    const baseQuantity = convertPackToBase(entryData.quantity, rawMaterial);

    // Calculate costs for pack/box materials
    const packInfo = getPackInfo(rawMaterial);
    let enhancedNotes = entryData.notes || "";
    let unitCost = entryData.unitCost;
    let totalCost = entryData.quantity * entryData.unitCost;

    if (packInfo) {
      const individualItemCost = entryData.unitCost / packInfo.unitsPerPack;
      enhancedNotes = `${enhancedNotes} (${entryData.quantity.toFixed(1)} ${rawMaterial.unit} = ${baseQuantity} ${packInfo.baseUnit}, Pack cost: $${entryData.unitCost.toFixed(2)}, Individual cost: $${individualItemCost.toFixed(4)})`.trim();
      unitCost = entryData.unitCost;
      totalCost = entryData.quantity * entryData.unitCost;
    }

    // Map frontend data to database format
    const dbData = {
      raw_material_id: entryData.rawMaterialId,
      quantity: new Decimal(baseQuantity),
      unit_cost: new Decimal(unitCost),
      total_cost: new Decimal(totalCost),
      supplier: entryData.supplier,
      batch_number: entryData.batchNumber,
      expiry_date: entryData.expiryDate,
      received_date: entryData.receivedDate,
      received_by: entryData.receivedBy,
      notes: enhancedNotes
    };

    const stockEntry = await prisma().stockEntry.create({
      data: dbData,
      include: {
        raw_material: true,
        user: true
      }
    });

    // Create initial stock movement
    const movementReason = packInfo ? `Stock received (${entryData.quantity} ${rawMaterial.unit} = ${baseQuantity} ${packInfo.baseUnit})` : "Stock received";

    await createStockMovement({
      stockEntryId: stockEntry.id,
      type: "IN",
      quantity: baseQuantity,
      reason: movementReason,
      performedBy: entryData.receivedBy
    });

    logger.info("Stock entry created successfully:", stockEntry.id);

    return {
      data: formatStockEntryForFrontend(stockEntry),
      success: true,
      message: "Stock entry created successfully"
    };
  } catch (error) {
    logger.error("Error in createStockEntry service:", error);
    return {
      data: null,
      success: false,
      message: error.message || "Failed to create stock entry"
    };
  }
};

/**
 * Create stock movement
 */
export const createStockMovement = async movementData => {
  try {
    logger.info("Creating stock movement:", movementData.type);

    // Auto-generate order ID if not provided
    let referenceId = movementData.referenceId;
    if (!referenceId) {
      try {
        referenceId = await generateNextOrderId();
      } catch (error) {
        logger.error("Failed to generate order ID for movement:", error);
        // Continue without order ID if generation fails
      }
    }

    const dbData = {
      stock_entry_id: movementData.stockEntryId,
      type: movementData.type,
      quantity: new Decimal(movementData.quantity),
      from_section_id: movementData.fromSectionId || null,
      to_section_id: movementData.toSectionId || null,
      reason: movementData.reason,
      performed_by: movementData.performedBy,
      reference_id: referenceId
    };

    const movement = await prisma().stockMovement.create({
      data: dbData,
      include: {
        stock_entry: {
          include: {
            raw_material: true
          }
        },
        from_section: true,
        to_section: true,
        user: true
      }
    });

    logger.info("Stock movement created successfully:", movement.id);

    return {
      data: formatStockMovementForFrontend(movement),
      success: true,
      message: "Stock movement created successfully"
    };
  } catch (error) {
    logger.error("Error in createStockMovement service:", error);
    return {
      data: null,
      success: false,
      message: error.message || "Failed to create stock movement"
    };
  }
};

/**
 * Get all stock entries with optional filtering
 */
export const getAllStockEntries = async (filters = {}) => {
  try {
    logger.info("Fetching stock entries with filters:", filters);

    const where = {};

    if (filters.rawMaterialId) {
      where.raw_material_id = filters.rawMaterialId;
    }

    if (filters.supplier) {
      where.supplier = {
        contains: filters.supplier,
        mode: "insensitive"
      };
    }

    if (filters.fromDate || filters.toDate) {
      where.received_date = {};
      if (filters.fromDate) {
        where.received_date.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.received_date.lte = new Date(filters.toDate);
      }
    }

    const entries = await prisma().stockEntry.findMany({
      where,
      include: {
        raw_material: true,
        user: true
      },
      orderBy: {
        received_date: "desc"
      }
    });

    return {
      data: entries.map(formatStockEntryForFrontend),
      success: true
    };
  } catch (error) {
    logger.error("Error in getAllStockEntries service:", error);
    throw new Error("Failed to retrieve stock entries");
  }
};

/**
 * Get stock movements with optional filtering
 */
export const getStockMovements = async (filters = {}) => {
  try {
    logger.info("Fetching stock movements with filters:", filters);

    const where = {};

    if (filters.stockEntryId) {
      where.stock_entry_id = filters.stockEntryId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.sectionId) {
      where.OR = [{ from_section_id: filters.sectionId }, { to_section_id: filters.sectionId }];
    }

    if (filters.fromDate || filters.toDate) {
      where.created_at = {};
      if (filters.fromDate) {
        where.created_at.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.created_at.lte = new Date(filters.toDate);
      }
    }

    const movements = await prisma().stockMovement.findMany({
      where,
      include: {
        stock_entry: {
          include: {
            raw_material: true
          }
        },
        from_section: true,
        to_section: true,
        user: true
      },
      orderBy: {
        created_at: "desc"
      }
    });

    return {
      data: movements.map(formatStockMovementForFrontend),
      success: true
    };
  } catch (error) {
    logger.error("Error in getStockMovements service:", error);
    throw new Error("Failed to retrieve stock movements");
  }
};

/**
 * Calculate current stock levels for all active materials
 */
export const getCurrentStockLevels = async () => {
  try {
    logger.info("Calculating current stock levels");

    // Get all active raw materials
    const rawMaterials = await prisma().rawMaterial.findMany({
      where: { is_active: true }
    });

    const stockLevels = [];

    for (const material of rawMaterials) {
      // Get all stock entries for this material
      const entries = await prisma().stockEntry.findMany({
        where: { raw_material_id: material.id }
      });

      let totalReceived = 0;
      let totalUsed = 0;

      for (const entry of entries) {
        totalReceived += parseFloat(entry.quantity.toString());

        // Get outbound movements for this entry
        const outboundMovements = await prisma().stockMovement.findMany({
          where: {
            stock_entry_id: entry.id,
            type: "OUT"
          }
        });

        totalUsed += outboundMovements.reduce((sum, movement) => sum + parseFloat(movement.quantity.toString()), 0);
      }

      const availableQuantity = totalReceived - totalUsed;
      const isLowStock = availableQuantity <= parseFloat(material.min_stock_level.toString());

      // Calculate pack/box quantities vs sub-unit quantities
      const packInfo = getPackInfo(material);
      let totalUnitsQuantity, availableUnitsQuantity, totalSubUnitsQuantity, availableSubUnitsQuantity;

      if (packInfo) {
        // For pack/box materials: totalReceived and availableQuantity are in base units
        totalSubUnitsQuantity = totalReceived;
        availableSubUnitsQuantity = availableQuantity;
        totalUnitsQuantity = totalReceived / packInfo.unitsPerPack;
        availableUnitsQuantity = availableQuantity / packInfo.unitsPerPack;
      } else {
        // For regular materials: units and sub-units are the same
        totalUnitsQuantity = totalReceived;
        availableUnitsQuantity = availableQuantity;
        totalSubUnitsQuantity = totalReceived;
        availableSubUnitsQuantity = availableQuantity;
      }

      stockLevels.push({
        rawMaterial: formatRawMaterialForFrontend(material),
        totalUnitsQuantity,
        availableUnitsQuantity,
        totalSubUnitsQuantity,
        availableSubUnitsQuantity,
        reservedQuantity: 0, // Would be calculated based on pending orders
        minLevel: parseFloat(material.min_stock_level.toString()),
        maxLevel: parseFloat(material.max_stock_level.toString()),
        isLowStock,
        lastUpdated: new Date()
      });
    }

    return {
      data: stockLevels,
      success: true
    };
  } catch (error) {
    logger.error("Error in getCurrentStockLevels service:", error);
    throw new Error("Failed to calculate stock levels");
  }
};

/**
 * Get stock level for specific material
 */
export const getStockLevel = async rawMaterialId => {
  try {
    logger.info("Getting stock level for material:", rawMaterialId);

    const levels = await getCurrentStockLevels();
    if (!levels.success) {
      throw new Error("Failed to calculate stock levels");
    }

    const level = levels.data.find(level => level.rawMaterial.id === rawMaterialId);

    return {
      data: level || null,
      success: true
    };
  } catch (error) {
    logger.error("Error in getStockLevel service:", error);
    return {
      data: null,
      success: false,
      message: error.message || "Failed to get stock level"
    };
  }
};

/**
 * Update stock entry
 */
export const updateStockEntry = async updateData => {
  try {
    const { id, ...data } = updateData;

    if (!id) {
      throw new Error("Stock entry ID is required");
    }

    logger.info("Updating stock entry:", id);

    // Get existing entry
    const existingEntry = await prisma().stockEntry.findUnique({
      where: { id },
      include: { raw_material: true }
    });

    if (!existingEntry) {
      throw new Error("Stock entry not found");
    }

    // Get raw material info if changing material
    let rawMaterial = existingEntry.raw_material;
    if (data.rawMaterialId && data.rawMaterialId !== existingEntry.raw_material_id) {
      rawMaterial = await prisma().rawMaterial.findUnique({
        where: { id: data.rawMaterialId }
      });
      if (!rawMaterial) {
        throw new Error("Raw material not found");
      }
    }

    // Convert pack quantity to base units if needed
    let quantity = data.quantity;
    if (quantity !== undefined && rawMaterial) {
      quantity = convertPackToBase(quantity, rawMaterial);
    }

    // Calculate costs for pack/box materials
    let notes = data.notes;
    let unitCost = data.unitCost;
    let totalCost = undefined;

    if (rawMaterial && (data.quantity !== undefined || data.unitCost !== undefined)) {
      const packInfo = getPackInfo(rawMaterial);
      if (packInfo && (data.quantity !== undefined || data.unitCost !== undefined)) {
        const finalQuantity = data.quantity !== undefined ? data.quantity : convertBaseToPack(parseFloat(existingEntry.quantity.toString()), rawMaterial);
        const finalUnitCost = data.unitCost !== undefined ? data.unitCost : parseFloat(existingEntry.unit_cost.toString());

        const individualItemCost = finalUnitCost / packInfo.unitsPerPack;
        const baseQuantity = convertPackToBase(finalQuantity, rawMaterial);

        notes = `${notes || existingEntry.notes || ""} (${finalQuantity.toFixed(1)} ${rawMaterial.unit} = ${baseQuantity} ${packInfo.baseUnit}, Pack cost: $${finalUnitCost.toFixed(2)}, Individual cost: $${individualItemCost.toFixed(4)})`.trim();

        unitCost = finalUnitCost;
        totalCost = finalQuantity * finalUnitCost;
      }
    }

    // Map frontend data to database format
    const dbData = {};
    if (data.rawMaterialId !== undefined) dbData.raw_material_id = data.rawMaterialId;
    if (quantity !== undefined) dbData.quantity = new Decimal(quantity);
    if (unitCost !== undefined) dbData.unit_cost = new Decimal(unitCost);
    if (totalCost !== undefined) dbData.total_cost = new Decimal(totalCost);
    if (data.supplier !== undefined) dbData.supplier = data.supplier;
    if (data.batchNumber !== undefined) dbData.batch_number = data.batchNumber;
    if (data.expiryDate !== undefined) dbData.expiry_date = data.expiryDate;
    if (data.receivedDate !== undefined) dbData.received_date = data.receivedDate;
    if (data.receivedBy !== undefined) dbData.received_by = data.receivedBy;
    if (notes !== undefined) dbData.notes = notes;

    // Calculate total cost if quantity or unit cost is being updated (for non-pack materials)
    if ((dbData.quantity !== undefined || dbData.unit_cost !== undefined) && !totalCost) {
      const finalQuantity = dbData.quantity ? parseFloat(dbData.quantity.toString()) : parseFloat(existingEntry.quantity.toString());
      const finalUnitCost = dbData.unit_cost ? parseFloat(dbData.unit_cost.toString()) : parseFloat(existingEntry.unit_cost.toString());
      dbData.total_cost = new Decimal(finalQuantity * finalUnitCost);
    }

    const updatedEntry = await prisma().stockEntry.update({
      where: { id },
      data: dbData,
      include: {
        raw_material: true,
        user: true
      }
    });

    logger.info("Stock entry updated successfully:", id);

    return {
      data: formatStockEntryForFrontend(updatedEntry),
      success: true,
      message: "Stock entry updated successfully"
    };
  } catch (error) {
    logger.error("Error in updateStockEntry service:", error);
    return {
      data: null,
      success: false,
      message: error.message || "Failed to update stock entry"
    };
  }
};

/**
 * Delete stock entry
 */
export const deleteStockEntry = async id => {
  try {
    if (!id) {
      throw new Error("Stock entry ID is required");
    }

    logger.info("Deleting stock entry:", id);

    // Check if there are any movements associated with this entry
    const movements = await prisma().stockMovement.findMany({
      where: { stock_entry_id: id }
    });

    if (movements.length > 0) {
      throw new Error("Cannot delete stock entry with associated movements. Please delete movements first.");
    }

    await prisma().stockEntry.delete({
      where: { id }
    });

    logger.info("Stock entry deleted successfully:", id);

    return {
      data: true,
      success: true,
      message: "Stock entry deleted successfully"
    };
  } catch (error) {
    logger.error("Error in deleteStockEntry service:", error);
    return {
      data: false,
      success: false,
      message: error.message || "Failed to delete stock entry"
    };
  }
};

/**
 * Transfer stock between sections
 */
export const transferStock = async (stockEntryId, fromSectionId, toSectionId, quantity, performedBy, reason) => {
  try {
    logger.info("Transferring stock:", { stockEntryId, fromSectionId, toSectionId, quantity });

    await createStockMovement({
      stockEntryId,
      type: "TRANSFER",
      quantity,
      fromSectionId,
      toSectionId,
      reason,
      performedBy
    });

    return {
      data: true,
      success: true,
      message: "Stock transferred successfully"
    };
  } catch (error) {
    logger.error("Error in transferStock service:", error);
    return {
      data: false,
      success: false,
      message: error.message || "Failed to transfer stock"
    };
  }
};

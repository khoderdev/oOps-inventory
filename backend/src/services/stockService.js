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
  return parseFloat((baseQuantity / packInfo.unitsPerPack).toFixed(1));
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
        totalUnitsQuantity = parseFloat((totalReceived / packInfo.unitsPerPack).toFixed(1));
        availableUnitsQuantity = parseFloat((availableQuantity / packInfo.unitsPerPack).toFixed(1));
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
export const deleteStockEntry = async (id, force = false) => {
  try {
    if (!id) {
      throw new Error("Stock entry ID is required");
    }

    logger.info(`Deleting stock entry ${id} (force=${force})`);

    const db = prisma();

    const movements = await db.stockMovement.findMany({
      where: { stock_entry_id: id }
    });

    if (movements.length > 0) {
      if (!force) {
        throw new Error("Cannot delete stock entry with associated movements. Please delete movements first.");
      }

      // Delete all associated movements first
      await db.stockMovement.deleteMany({
        where: { stock_entry_id: id }
      });

      logger.info(`Deleted ${movements.length} associated stock movements for entry ${id}`);
    }

    await db.stockEntry.delete({
      where: { id }
    });

    logger.info(`Stock entry ${id} deleted successfully.`);

    return {
      data: true,
      success: true,
      message: "Stock entry and associated movements deleted successfully"
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

/**
 * Get comprehensive reports data
 */
export const getReportsData = async (days = 30, sectionId = null) => {
  try {
    logger.info("Generating comprehensive reports data");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all required data
    const [stockLevels, stockEntries, stockMovements, rawMaterials, sections] = await Promise.all([getCurrentStockLevels(), getAllStockEntries({ fromDate: cutoffDate.toISOString() }), getStockMovements({ fromDate: cutoffDate.toISOString(), ...(sectionId && { sectionId }) }), prisma().rawMaterial.findMany({ where: { is_active: true } }), prisma().section.findMany({ where: { is_active: true } })]);

    // Calculate metrics
    const totalInventoryValue = stockLevels.data.reduce((sum, level) => sum + level.availableUnitsQuantity * level.rawMaterial.unitCost, 0);

    const lowStockItems = stockLevels.data.filter(level => level.isLowStock);

    const totalPurchaseValue = stockEntries.data.reduce((sum, entry) => sum + entry.totalCost, 0);

    const consumptionMovements = stockMovements.data.filter(movement => movement.type === "OUT" || movement.type === "EXPIRED" || movement.type === "DAMAGED");

    const totalConsumptionValue = consumptionMovements.reduce((sum, movement) => {
      const material = rawMaterials.find(m => {
        const entry = stockEntries.data.find(e => e.id === movement.stockEntryId);
        return entry && entry.rawMaterialId === m.id;
      });
      return sum + movement.quantity * (material?.unit_cost ? parseFloat(material.unit_cost.toString()) : 0);
    }, 0);

    const wasteValue = stockMovements.data
      .filter(movement => movement.type === "EXPIRED" || movement.type === "DAMAGED")
      .reduce((sum, movement) => {
        const material = rawMaterials.find(m => {
          const entry = stockEntries.data.find(e => e.id === movement.stockEntryId);
          return entry && entry.rawMaterialId === m.id;
        });
        return sum + movement.quantity * (material?.unit_cost ? parseFloat(material.unit_cost.toString()) : 0);
      }, 0);

    // Category breakdown
    const categoryBreakdown = rawMaterials.reduce((acc, material) => {
      const level = stockLevels.data.find(l => l.rawMaterial.id === material.id);
      const value = level ? level.availableUnitsQuantity * parseFloat(material.unit_cost.toString()) : 0;
      acc[material.category] = (acc[material.category] || 0) + value;
      return acc;
    }, {});

    // Consumption by category
    const consumptionByCategory = consumptionMovements.reduce((acc, movement) => {
      const entry = stockEntries.data.find(e => e.id === movement.stockEntryId);
      const material = rawMaterials.find(m => m.id === entry?.rawMaterialId);
      if (material) {
        const value = movement.quantity * parseFloat(material.unit_cost.toString());
        acc[material.category] = (acc[material.category] || 0) + value;
      }
      return acc;
    }, {});

    // Expense breakdown
    const purchasesByCategory = stockEntries.data.reduce((acc, entry) => {
      const material = rawMaterials.find(m => m.id === entry.rawMaterialId);
      if (material) {
        acc[material.category] = (acc[material.category] || 0) + entry.totalCost;
      }
      return acc;
    }, {});

    const totalPurchases = Object.values(purchasesByCategory).reduce((sum, val) => sum + val, 0);

    const topSuppliers = [...new Set(stockEntries.data.map(e => e.supplier).filter(Boolean))]
      .map(supplier => ({
        name: supplier,
        total: stockEntries.data.filter(e => e.supplier === supplier).reduce((sum, e) => sum + e.totalCost, 0)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const reportData = {
      metrics: {
        totalInventoryValue,
        lowStockCount: lowStockItems.length,
        totalPurchaseValue,
        totalConsumptionValue,
        wasteValue,
        totalMovements: stockMovements.data.length,
        totalEntries: stockEntries.data.length,
        activeMaterials: rawMaterials.length,
        activeSections: sections.length
      },
      categoryBreakdown,
      consumptionByCategory,
      expenseBreakdown: {
        purchases: purchasesByCategory,
        totalPurchases,
        averageOrderValue: stockEntries.data.length > 0 ? totalPurchases / stockEntries.data.length : 0,
        topSuppliers
      },
      lowStockItems: lowStockItems.map(item => ({
        id: item.rawMaterial.id,
        name: item.rawMaterial.name,
        category: item.rawMaterial.category,
        currentStock: item.availableUnitsQuantity,
        minLevel: item.minLevel,
        unit: item.rawMaterial.unit
      }))
    };

    return {
      data: reportData,
      success: true
    };
  } catch (error) {
    logger.error("Error in getReportsData service:", error);
    throw new Error("Failed to generate reports data");
  }
};

/**
 * Get consumption report data
 */
export const getConsumptionReport = async (days = 30, sectionId = null) => {
  try {
    logger.info("Generating consumption report data");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filters = {
      fromDate: cutoffDate.toISOString(),
      ...(sectionId && { sectionId })
    };

    const [stockMovements, stockEntries, rawMaterials] = await Promise.all([getStockMovements(filters), getAllStockEntries(), prisma().rawMaterial.findMany({ where: { is_active: true } })]);

    // Filter consumption movements
    const consumptionMovements = stockMovements.data.filter(movement => movement.type === "OUT" || movement.type === "EXPIRED" || movement.type === "DAMAGED");

    // Calculate consumption data
    const totalQuantityConsumed = consumptionMovements.reduce((sum, movement) => sum + movement.quantity, 0);

    const totalValueConsumed = consumptionMovements.reduce((sum, movement) => {
      const entry = stockEntries.data.find(e => e.id === movement.stockEntryId);
      const material = rawMaterials.find(m => m.id === entry?.rawMaterialId);
      return sum + movement.quantity * (material?.unit_cost ? parseFloat(material.unit_cost.toString()) : 0);
    }, 0);

    // Group by reason
    const byReason = consumptionMovements.reduce((acc, movement) => {
      const reason = movement.reason || "Unknown";
      if (!acc[reason]) {
        acc[reason] = { count: 0, totalValue: 0 };
      }

      const entry = stockEntries.data.find(e => e.id === movement.stockEntryId);
      const material = rawMaterials.find(m => m.id === entry?.rawMaterialId);
      const value = movement.quantity * (material?.unit_cost ? parseFloat(material.unit_cost.toString()) : 0);

      acc[reason].count += 1;
      acc[reason].totalValue += value;
      return acc;
    }, {});

    // Group by material
    const byMaterial = consumptionMovements.reduce((acc, movement) => {
      const entry = stockEntries.data.find(e => e.id === movement.stockEntryId);
      const material = rawMaterials.find(m => m.id === entry?.rawMaterialId);

      if (material) {
        if (!acc[material.id]) {
          acc[material.id] = {
            material: formatRawMaterialForFrontend(material),
            totalQuantity: 0,
            totalValue: 0,
            movements: []
          };
        }

        const value = movement.quantity * parseFloat(material.unit_cost.toString());
        acc[material.id].totalQuantity += movement.quantity;
        acc[material.id].totalValue += value;
        acc[material.id].movements.push(movement);
      }
      return acc;
    }, {});

    // Waste analysis
    const wasteMovements = consumptionMovements.filter(m => m.type === "EXPIRED" || m.type === "DAMAGED");
    const wasteValue = wasteMovements.reduce((sum, movement) => {
      const entry = stockEntries.data.find(e => e.id === movement.stockEntryId);
      const material = rawMaterials.find(m => m.id === entry?.rawMaterialId);
      return sum + movement.quantity * (material?.unit_cost ? parseFloat(material.unit_cost.toString()) : 0);
    }, 0);

    // Category consumption
    const consumptionByCategory = consumptionMovements.reduce((acc, movement) => {
      const entry = stockEntries.data.find(e => e.id === movement.stockEntryId);
      const material = rawMaterials.find(m => m.id === entry?.rawMaterialId);
      if (material) {
        const value = movement.quantity * parseFloat(material.unit_cost.toString());
        acc[material.category] = (acc[material.category] || 0) + value;
      }
      return acc;
    }, {});

    const consumptionData = {
      totalQuantityConsumed,
      totalValueConsumed,
      byReason,
      byMaterial,
      wasteValue,
      wasteCount: wasteMovements.length,
      totalMovements: consumptionMovements.length,
      consumptionByCategory,
      topConsumedMaterials: Object.values(byMaterial)
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10),
      recentActivity: consumptionMovements.slice(0, 10)
    };

    return {
      data: consumptionData,
      success: true
    };
  } catch (error) {
    logger.error("Error in getConsumptionReport service:", error);
    throw new Error("Failed to generate consumption report");
  }
};

/**
 * Get expense report data
 */
export const getExpenseReport = async (days = 30) => {
  try {
    logger.info("Generating expense report data");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const [stockEntries, rawMaterials] = await Promise.all([getAllStockEntries({ fromDate: cutoffDate.toISOString() }), prisma().rawMaterial.findMany({ where: { is_active: true } })]);

    // Calculate expense breakdown by category
    const purchasesByCategory = stockEntries.data.reduce((acc, entry) => {
      const material = rawMaterials.find(m => m.id === entry.rawMaterialId);
      if (material) {
        acc[material.category] = (acc[material.category] || 0) + entry.totalCost;
      }
      return acc;
    }, {});

    const totalPurchases = Object.values(purchasesByCategory).reduce((sum, val) => sum + val, 0);

    // Supplier analysis
    const topSuppliers = [...new Set(stockEntries.data.map(e => e.supplier).filter(Boolean))]
      .map(supplier => {
        const supplierEntries = stockEntries.data.filter(e => e.supplier === supplier);
        const total = supplierEntries.reduce((sum, e) => sum + e.totalCost, 0);
        const uniqueMaterials = new Set(supplierEntries.map(e => e.rawMaterialId)).size;
        const lastOrder = supplierEntries.length > 0 ? new Date(Math.max(...supplierEntries.map(e => new Date(e.receivedDate).getTime()))) : null;

        return {
          name: supplier,
          total,
          orderCount: supplierEntries.length,
          avgOrderValue: supplierEntries.length > 0 ? total / supplierEntries.length : 0,
          uniqueMaterials,
          lastOrder
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Material cost analysis
    const materialCosts = rawMaterials
      .map(material => {
        const materialEntries = stockEntries.data.filter(entry => entry.rawMaterialId === material.id);
        const totalCost = materialEntries.reduce((sum, entry) => sum + entry.totalCost, 0);
        const totalQuantity = materialEntries.reduce((sum, entry) => sum + entry.quantity, 0);
        const avgUnitCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

        return {
          material: formatRawMaterialForFrontend(material),
          totalCost,
          totalQuantity,
          avgUnitCost,
          entryCount: materialEntries.length,
          lastPurchase: materialEntries.length > 0 ? new Date(Math.max(...materialEntries.map(e => new Date(e.receivedDate).getTime()))) : null
        };
      })
      .filter(item => item.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost);

    // Monthly trend (last 4 periods)
    const periods = [];
    for (let i = 3; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - (i * days) / 4);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days / 4);

      const periodEntries = stockEntries.data.filter(entry => {
        const entryDate = new Date(entry.receivedDate);
        return entryDate >= startDate && entryDate <= endDate;
      });

      periods.push({
        period: `Period ${4 - i}`,
        total: periodEntries.reduce((sum, entry) => sum + entry.totalCost, 0),
        count: periodEntries.length
      });
    }

    const expenseData = {
      purchases: purchasesByCategory,
      totalPurchases,
      averageOrderValue: stockEntries.data.length > 0 ? totalPurchases / stockEntries.data.length : 0,
      topSuppliers,
      materialCosts,
      periods,
      totalEntries: stockEntries.data.length
    };

    return {
      data: expenseData,
      success: true
    };
  } catch (error) {
    logger.error("Error in getExpenseReport service:", error);
    throw new Error("Failed to generate expense report");
  }
};

/**
 * Get low stock report data
 */
export const getLowStockReport = async () => {
  try {
    logger.info("Generating low stock report data");

    const stockLevels = await getCurrentStockLevels();
    if (!stockLevels.success) {
      throw new Error("Failed to get stock levels");
    }

    const lowStockItems = stockLevels.data.filter(level => level.isLowStock);
    const criticalItems = lowStockItems.filter(level => level.availableUnitsQuantity <= 0);
    const warningItems = lowStockItems.filter(level => level.availableUnitsQuantity > 0 && level.availableUnitsQuantity <= level.minLevel * 0.5);

    const lowStockData = {
      summary: {
        totalLowStock: lowStockItems.length,
        critical: criticalItems.length,
        warning: warningItems.length
      },
      items: {
        critical: criticalItems.map(item => ({
          id: item.rawMaterial.id,
          name: item.rawMaterial.name,
          category: item.rawMaterial.category,
          currentStock: item.availableUnitsQuantity,
          minLevel: item.minLevel,
          unit: item.rawMaterial.unit,
          unitCost: item.rawMaterial.unitCost,
          value: item.availableUnitsQuantity * item.rawMaterial.unitCost
        })),
        warning: warningItems.map(item => ({
          id: item.rawMaterial.id,
          name: item.rawMaterial.name,
          category: item.rawMaterial.category,
          currentStock: item.availableUnitsQuantity,
          minLevel: item.minLevel,
          unit: item.rawMaterial.unit,
          unitCost: item.rawMaterial.unitCost,
          value: item.availableUnitsQuantity * item.rawMaterial.unitCost
        })),
        all: lowStockItems.map(item => ({
          id: item.rawMaterial.id,
          name: item.rawMaterial.name,
          category: item.rawMaterial.category,
          currentStock: item.availableUnitsQuantity,
          minLevel: item.minLevel,
          unit: item.rawMaterial.unit,
          unitCost: item.rawMaterial.unitCost,
          value: item.availableUnitsQuantity * item.rawMaterial.unitCost,
          stockPercentage: (item.availableUnitsQuantity / item.minLevel) * 100
        }))
      }
    };

    return {
      data: lowStockData,
      success: true
    };
  } catch (error) {
    logger.error("Error in getLowStockReport service:", error);
    throw new Error("Failed to generate low stock report");
  }
};

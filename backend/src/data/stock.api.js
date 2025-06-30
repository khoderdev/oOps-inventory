import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";
import { generateNextOrderId } from "../utils/orderId.js";

export class StockAPI {
  // Helper function to get pack information from raw material
  static getPackInfo(rawMaterial) {
    const isPackOrBox = rawMaterial.unit === "PACKS" || rawMaterial.unit === "BOXES";
    if (!isPackOrBox) return null;

    return {
      unitsPerPack: rawMaterial.units_per_pack || 1,
      baseUnit: rawMaterial.base_unit || "PIECES",
      packUnit: rawMaterial.unit
    };
  }

  // Helper function to convert pack quantity to base units
  static convertPackToBase(quantity, rawMaterial) {
    const packInfo = this.getPackInfo(rawMaterial);
    if (!packInfo) return quantity;
    return quantity * packInfo.unitsPerPack;
  }

  // Helper function to convert base units to pack quantity
  static convertBaseToPack(baseQuantity, rawMaterial) {
    const packInfo = this.getPackInfo(rawMaterial);
    if (!packInfo) return baseQuantity;
    return baseQuantity / packInfo.unitsPerPack;
  }

  // Create a new stock entry
  static async createEntry(data) {
    try {
      // Get raw material to understand pack structure
      const rawMaterial = await prisma().rawMaterial.findUnique({
        where: { id: data.rawMaterialId }
      });

      if (!rawMaterial) {
        throw new Error("Raw material not found");
      }

      // Convert pack quantity to base units if needed
      const baseQuantity = this.convertPackToBase(data.quantity, rawMaterial);

      // Calculate costs for pack/box materials
      const packInfo = this.getPackInfo(rawMaterial);
      let enhancedNotes = data.notes || "";
      let unitCost = data.unitCost;
      let totalCost = data.quantity * data.unitCost;

      if (packInfo) {
        const individualItemCost = data.unitCost / packInfo.unitsPerPack;
        enhancedNotes = `${enhancedNotes} (${data.quantity.toFixed(1)} ${rawMaterial.unit} = ${baseQuantity} ${packInfo.baseUnit}, Pack cost: $${data.unitCost.toFixed(2)}, Individual cost: $${individualItemCost.toFixed(4)})`.trim();
        unitCost = data.unitCost;
        totalCost = data.quantity * data.unitCost;
      }

      const stockEntryData = {
        raw_material_id: data.rawMaterialId,
        quantity: new Decimal(baseQuantity),
        unit_cost: new Decimal(unitCost),
        total_cost: new Decimal(totalCost),
        supplier: data.supplier,
        batch_number: data.batchNumber,
        expiry_date: data.expiryDate,
        received_date: data.receivedDate,
        received_by: data.receivedBy,
        notes: enhancedNotes
      };

      const stockEntry = await prisma().stockEntry.create({
        data: stockEntryData,
        include: {
          raw_material: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Create initial stock movement
      const movementReason = packInfo ? `Stock received (${data.quantity.toFixed(1)} ${rawMaterial.unit} = ${baseQuantity} ${packInfo.baseUnit})` : "Stock received";

      await this.createMovement({
        stockEntryId: stockEntry.id,
        type: "IN",
        quantity: baseQuantity,
        reason: movementReason,
        performedBy: data.receivedBy
      });

      const response = this.formatStockEntryForFrontend(stockEntry);

      return {
        data: response,
        success: true,
        message: "Stock entry created successfully"
      };
    } catch (error) {
      logger.error("Error creating stock entry:", error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to create stock entry"
      };
    }
  }

  // Create stock movement
  static async createMovement(data) {
    try {
      // Auto-generate order ID if not provided
      const movementData = { ...data };
      if (!movementData.referenceId) {
        try {
          const orderId = await generateNextOrderId();
          movementData.referenceId = orderId;
        } catch (error) {
          logger.error("Failed to generate order ID for movement:", error);
        }
      }

      const stockMovementData = {
        stock_entry_id: movementData.stockEntryId,
        type: movementData.type,
        quantity: new Decimal(movementData.quantity),
        from_section_id: movementData.fromSectionId,
        to_section_id: movementData.toSectionId,
        reason: movementData.reason,
        performed_by: movementData.performedBy,
        reference_id: movementData.referenceId
      };

      const stockMovement = await prisma().stockMovement.create({
        data: stockMovementData,
        include: {
          stock_entry: {
            include: {
              raw_material: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          from_section: true,
          to_section: true
        }
      });

      const response = this.formatStockMovementForFrontend(stockMovement);

      return {
        data: response,
        success: true,
        message: "Stock movement created successfully"
      };
    } catch (error) {
      logger.error("Error creating stock movement:", error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to create stock movement"
      };
    }
  }

  // Get all stock entries with optional filtering
  static async getAllEntries(filters = {}) {
    try {
      const where = {};

      if (filters.rawMaterialId) {
        where.raw_material_id = filters.rawMaterialId;
      }

      if (filters.supplier) {
        where.supplier = { contains: filters.supplier, mode: "insensitive" };
      }

      if (filters.fromDate || filters.toDate) {
        where.received_date = {};
        if (filters.fromDate) where.received_date.gte = filters.fromDate;
        if (filters.toDate) where.received_date.lte = filters.toDate;
      }

      const stockEntries = await prisma().stockEntry.findMany({
        where,
        include: {
          raw_material: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { received_date: "desc" }
      });

      const response = stockEntries.map(entry => this.formatStockEntryForFrontend(entry));

      return {
        data: response,
        success: true
      };
    } catch (error) {
      logger.error("Error fetching stock entries:", error);
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch stock entries"
      };
    }
  }

  // Get stock movements with optional filtering
  static async getMovements(filters = {}) {
    try {
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
        if (filters.fromDate) where.created_at.gte = filters.fromDate;
        if (filters.toDate) where.created_at.lte = filters.toDate;
      }

      const stockMovements = await prisma().stockMovement.findMany({
        where,
        include: {
          stock_entry: {
            include: {
              raw_material: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          from_section: true,
          to_section: true
        },
        orderBy: { created_at: "desc" }
      });

      const response = stockMovements.map(movement => this.formatStockMovementForFrontend(movement));

      return {
        data: response,
        success: true
      };
    } catch (error) {
      logger.error("Error fetching stock movements:", error);
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch stock movements"
      };
    }
  }

  // Calculate current stock levels
  static async getCurrentStockLevels() {
    try {
      const materials = await prisma().rawMaterial.findMany({
        where: { is_active: true },
        include: {
          stock_entries: {
            include: {
              stock_movements: {
                where: { type: "OUT" }
              }
            }
          }
        }
      });

      const stockLevels = materials.map(material => {
        const totalReceived = material.stock_entries.reduce((sum, entry) => sum + parseFloat(entry.quantity.toString()), 0);

        const totalUsed = material.stock_entries.reduce((sum, entry) => sum + entry.stock_movements.reduce((movSum, movement) => movSum + parseFloat(movement.quantity.toString()), 0), 0);

        const availableQuantity = totalReceived - totalUsed;
        const minLevel = parseFloat(material.min_stock_level.toString());
        const maxLevel = parseFloat(material.max_stock_level.toString());
        const isLowStock = availableQuantity <= minLevel;

        return {
          rawMaterialId: material.id,
          rawMaterial: material,
          totalQuantity: totalReceived,
          availableQuantity,
          reservedQuantity: 0, // Would be calculated based on pending orders
          minLevel,
          maxLevel,
          isLowStock,
          lastUpdated: new Date()
        };
      });

      return {
        data: stockLevels,
        success: true
      };
    } catch (error) {
      logger.error("Error calculating stock levels:", error);
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to calculate stock levels"
      };
    }
  }

  // Get stock level for specific material
  static async getStockLevel(rawMaterialId) {
    try {
      const levels = await this.getCurrentStockLevels();
      if (!levels.success) {
        throw new Error(levels.message);
      }

      const level = levels.data.find(level => level.rawMaterialId === rawMaterialId);

      return {
        data: level || null,
        success: true
      };
    } catch (error) {
      logger.error("Error getting stock level:", error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to get stock level"
      };
    }
  }

  // Helper methods to format data for frontend
  static formatStockEntryForFrontend(stockEntry) {
    return {
      id: stockEntry.id,
      rawMaterialId: stockEntry.raw_material_id,
      quantity: parseFloat(stockEntry.quantity.toString()),
      unitCost: parseFloat(stockEntry.unit_cost.toString()),
      totalCost: parseFloat(stockEntry.total_cost.toString()),
      supplier: stockEntry.supplier,
      batchNumber: stockEntry.batch_number,
      expiryDate: stockEntry.expiry_date,
      receivedDate: stockEntry.received_date,
      receivedBy: stockEntry.received_by,
      notes: stockEntry.notes,
      createdAt: stockEntry.created_at,
      updatedAt: stockEntry.updated_at,
      rawMaterial: stockEntry.raw_material,
      user: stockEntry.user
    };
  }

  static formatStockMovementForFrontend(stockMovement) {
    return {
      id: stockMovement.id,
      stockEntryId: stockMovement.stock_entry_id,
      type: stockMovement.type,
      quantity: parseFloat(stockMovement.quantity.toString()),
      fromSectionId: stockMovement.from_section_id,
      toSectionId: stockMovement.to_section_id,
      reason: stockMovement.reason,
      performedBy: stockMovement.performed_by,
      referenceId: stockMovement.reference_id,
      createdAt: stockMovement.created_at,
      updatedAt: stockMovement.updated_at,
      stockEntry: stockMovement.stock_entry,
      user: stockMovement.user,
      fromSection: stockMovement.from_section,
      toSection: stockMovement.to_section
    };
  }
}

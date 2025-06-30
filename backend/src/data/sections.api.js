import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";
import { generateNextOrderId } from "../utils/orderId.js";

export class SectionsAPI {
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

  // Create a new section
  static async create(data) {
    try {
      const sectionData = {
        name: data.name,
        description: data.description,
        type: data.type,
        manager_id: data.managerId,
        is_active: true
      };

      const section = await prisma().section.create({
        data: sectionData,
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      const response = this.formatSectionForFrontend(section);

      return {
        data: response,
        success: true,
        message: "Section created successfully"
      };
    } catch (error) {
      logger.error("Error creating section:", error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to create section"
      };
    }
  }

  // Get all sections
  static async getAll(filters = {}) {
    try {
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
          manager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { name: "asc" }
      });

      const response = sections.map(section => this.formatSectionForFrontend(section));

      return {
        data: response,
        success: true
      };
    } catch (error) {
      logger.error("Error fetching sections:", error);
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch sections"
      };
    }
  }

  // Get section by ID
  static async getById(id) {
    try {
      const section = await prisma().section.findUnique({
        where: { id },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!section) {
        return {
          data: null,
          success: true
        };
      }

      const response = this.formatSectionForFrontend(section);

      return {
        data: response,
        success: true
      };
    } catch (error) {
      logger.error("Error fetching section by ID:", error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch section"
      };
    }
  }

  // Update section
  static async update(data) {
    try {
      const { id, ...updateData } = data;

      const sectionData = {};
      if (updateData.name !== undefined) sectionData.name = updateData.name;
      if (updateData.description !== undefined) sectionData.description = updateData.description;
      if (updateData.type !== undefined) sectionData.type = updateData.type;
      if (updateData.managerId !== undefined) sectionData.manager_id = updateData.managerId;
      if (updateData.isActive !== undefined) sectionData.is_active = updateData.isActive;

      const section = await prisma().section.update({
        where: { id },
        data: sectionData,
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      const response = this.formatSectionForFrontend(section);

      return {
        data: response,
        success: true,
        message: "Section updated successfully"
      };
    } catch (error) {
      logger.error("Error updating section:", error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to update section"
      };
    }
  }

  // Delete section (soft delete)
  static async delete(id) {
    try {
      await prisma().section.update({
        where: { id },
        data: { is_active: false }
      });

      return {
        data: true,
        success: true,
        message: "Section deleted successfully"
      };
    } catch (error) {
      logger.error("Error deleting section:", error);
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete section"
      };
    }
  }

  // Assign stock to section
  static async assignStock(data) {
    try {
      const { sectionId, rawMaterialId, quantity, assignedBy, notes } = data;

      // Get raw material info for pack conversion
      const rawMaterial = await prisma().rawMaterial.findUnique({
        where: { id: rawMaterialId }
      });

      if (!rawMaterial) {
        throw new Error("Raw material not found");
      }

      // Convert pack quantity to base units if needed
      const baseQuantityToAssign = this.convertPackToBase(quantity, rawMaterial);

      // Check if section inventory entry exists
      const existingInventory = await prisma().sectionInventory.findUnique({
        where: {
          section_id_raw_material_id: {
            section_id: sectionId,
            raw_material_id: rawMaterialId
          }
        }
      });

      if (existingInventory) {
        // Update existing inventory
        await prisma().sectionInventory.update({
          where: { id: existingInventory.id },
          data: {
            quantity: existingInventory.quantity.add(new Decimal(baseQuantityToAssign)),
            last_updated: new Date()
          }
        });
      } else {
        // Create new inventory entry
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
      const packInfo = this.getPackInfo(rawMaterial);
      const movementNotes = packInfo ? `${notes || "Stock assigned to section"} (${quantity.toFixed(1)} ${rawMaterial.unit} = ${baseQuantityToAssign} ${packInfo.baseUnit})` : notes || "Stock assigned to section";

      // Find an available stock entry
      const stockEntry = await prisma().stockEntry.findFirst({
        where: { raw_material_id: rawMaterialId },
        orderBy: { received_date: "desc" }
      });

      if (stockEntry) {
        await prisma().stockMovement.create({
          data: {
            stock_entry_id: stockEntry.id,
            type: "TRANSFER",
            quantity: new Decimal(baseQuantityToAssign),
            to_section_id: sectionId,
            reason: movementNotes,
            performed_by: assignedBy
          }
        });
      }

      return {
        data: true,
        success: true,
        message: "Stock assigned to section successfully"
      };
    } catch (error) {
      logger.error("Error assigning stock to section:", error);
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to assign stock to section"
      };
    }
  }

  // Get section inventory
  static async getSectionInventory(sectionId) {
    try {
      const inventory = await prisma().sectionInventory.findMany({
        where: { section_id: sectionId },
        include: {
          raw_material: true,
          section: true
        }
      });

      const response = inventory.map(item => this.formatInventoryForFrontend(item));

      return {
        data: response,
        success: true
      };
    } catch (error) {
      logger.error("Error fetching section inventory:", error);
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch section inventory"
      };
    }
  }

  // Record consumption in section
  static async recordConsumption(sectionId, rawMaterialId, quantity, consumedBy, reason, orderId, notes) {
    try {
      // Auto-generate order ID if not provided
      let finalOrderId = orderId;
      if (!finalOrderId) {
        try {
          finalOrderId = await generateNextOrderId();
        } catch (error) {
          logger.error("Failed to generate order ID:", error);
        }
      }

      // Get current inventory
      const inventory = await prisma().sectionInventory.findUnique({
        where: {
          section_id_raw_material_id: {
            section_id: sectionId,
            raw_material_id: rawMaterialId
          }
        }
      });

      if (!inventory) {
        throw new Error("No inventory found for this material in the section");
      }

      // Check if we have enough stock
      const currentQuantity = parseFloat(inventory.quantity.toString());
      if (currentQuantity < quantity) {
        throw new Error(`Insufficient stock. Available: ${currentQuantity}, Requested: ${quantity}`);
      }

      // Update inventory
      await prisma().sectionInventory.update({
        where: { id: inventory.id },
        data: {
          quantity: inventory.quantity.sub(new Decimal(quantity)),
          last_updated: new Date()
        }
      });

      // Create consumption record
      await prisma().sectionConsumption.create({
        data: {
          section_id: sectionId,
          raw_material_id: rawMaterialId,
          quantity: new Decimal(quantity),
          consumed_by: consumedBy,
          consumed_date: new Date(),
          reason: reason,
          order_id: finalOrderId,
          notes: notes
        }
      });

      // Create stock movement for tracking
      const stockEntry = await prisma().stockEntry.findFirst({
        where: { raw_material_id: rawMaterialId },
        orderBy: { received_date: "desc" }
      });

      if (stockEntry) {
        await prisma().stockMovement.create({
          data: {
            stock_entry_id: stockEntry.id,
            type: "OUT",
            quantity: new Decimal(quantity),
            from_section_id: sectionId,
            reason: reason,
            performed_by: consumedBy
          }
        });
      }

      return {
        data: true,
        success: true,
        message: "Consumption recorded successfully"
      };
    } catch (error) {
      logger.error("Error recording consumption:", error);
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to record consumption"
      };
    }
  }

  // Get section consumption history
  static async getSectionConsumption(sectionId, filters = {}) {
    try {
      const where = { section_id: sectionId };

      if (filters.rawMaterialId) {
        where.raw_material_id = filters.rawMaterialId;
      }

      if (filters.fromDate || filters.toDate) {
        where.consumed_date = {};
        if (filters.fromDate) where.consumed_date.gte = filters.fromDate;
        if (filters.toDate) where.consumed_date.lte = filters.toDate;
      }

      const consumption = await prisma().sectionConsumption.findMany({
        where,
        include: {
          raw_material: true,
          section: true
        },
        orderBy: { consumed_date: "desc" }
      });

      const response = consumption.map(item => this.formatConsumptionForFrontend(item));

      return {
        data: response,
        success: true
      };
    } catch (error) {
      logger.error("Error fetching section consumption:", error);
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch section consumption"
      };
    }
  }

  // Helper methods to format data for frontend
  static formatSectionForFrontend(section) {
    return {
      id: section.id,
      name: section.name,
      description: section.description,
      type: section.type,
      managerId: section.manager_id,
      isActive: section.is_active,
      createdAt: section.created_at,
      updatedAt: section.updated_at,
      manager: section.manager
    };
  }

  static formatInventoryForFrontend(inventory) {
    const formatted = {
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
      rawMaterial: inventory.raw_material,
      section: inventory.section
    };

    // Add pack information for display
    if (inventory.raw_material) {
      const packInfo = this.getPackInfo(inventory.raw_material);
      if (packInfo) {
        formatted.packQuantity = this.convertBaseToPack(formatted.quantity, inventory.raw_material);
        formatted.packInfo = packInfo;
      }
    }

    return formatted;
  }

  static formatConsumptionForFrontend(consumption) {
    const formatted = {
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
      rawMaterial: consumption.raw_material,
      section: consumption.section
    };

    // Add pack information for display
    if (consumption.raw_material) {
      const packInfo = this.getPackInfo(consumption.raw_material);
      if (packInfo) {
        formatted.packQuantity = this.convertBaseToPack(formatted.quantity, consumption.raw_material);
        formatted.packInfo = packInfo;
      }
    }

    return formatted;
  }
}

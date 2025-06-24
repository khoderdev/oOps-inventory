import { db } from "../lib/database";
import { StockAPI } from "./stock.api";
import type { Section, SectionInventory, SectionConsumption, CreateSectionInput, UpdateSectionInput, CreateSectionAssignmentInput, MovementType, ApiResponse } from "../types";

export class SectionsAPI {
  // Create a new section
  static async create(data: CreateSectionInput): Promise<ApiResponse<Section>> {
    try {
      const newSection: Omit<Section, "id" | "createdAt" | "updatedAt"> = {
        ...data,
        isActive: true
      };

      const id = await db.sections.add(newSection as Section);
      const created = await db.sections.get(id);

      if (!created) {
        throw new Error("Failed to create section");
      }

      return {
        data: created,
        success: true,
        message: "Section created successfully"
      };
    } catch (error) {
      return {
        data: {} as Section,
        success: false,
        message: error instanceof Error ? error.message : "Failed to create section"
      };
    }
  }

  // Get all sections
  static async getAll(filters?: { type?: string; isActive?: boolean; managerId?: string }): Promise<ApiResponse<Section[]>> {
    try {
      let query = db.sections.orderBy("name");

      if (filters?.isActive !== undefined) {
        query = query.filter(section => section.isActive === filters.isActive);
      }

      if (filters?.type) {
        query = query.filter(section => section.type === filters.type);
      }

      if (filters?.managerId) {
        query = query.filter(section => section.managerId === filters.managerId);
      }

      const sections = await query.toArray();

      return {
        data: sections,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch sections"
      };
    }
  }

  // Get section by ID
  static async getById(id: string): Promise<ApiResponse<Section | null>> {
    try {
      const section = await db.sections.get(id);
      return {
        data: section || null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch section"
      };
    }
  }

  // Update section
  static async update(data: UpdateSectionInput): Promise<ApiResponse<Section>> {
    try {
      const { id, ...updateData } = data;
      await db.sections.update(id, updateData);

      const updated = await db.sections.get(id);
      if (!updated) {
        throw new Error("Section not found after update");
      }

      return {
        data: updated,
        success: true,
        message: "Section updated successfully"
      };
    } catch (error) {
      return {
        data: {} as Section,
        success: false,
        message: error instanceof Error ? error.message : "Failed to update section"
      };
    }
  }

  // Delete section (soft delete)
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      await db.sections.update(id, { isActive: false });
      return {
        data: true,
        success: true,
        message: "Section deleted successfully"
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete section"
      };
    }
  }

  // Assign stock to section
  static async assignStock(data: CreateSectionAssignmentInput): Promise<ApiResponse<boolean>> {
    try {
      const { sectionId, rawMaterialId, quantity, assignedBy, notes } = data;

      // Check if we have enough stock available
      const stockLevel = await StockAPI.getStockLevel(rawMaterialId);
      if (!stockLevel.success || !stockLevel.data) {
        throw new Error("Unable to check stock availability");
      }

      if (stockLevel.data.availableQuantity < quantity) {
        throw new Error("Insufficient stock available");
      }

      // Check if section inventory entry exists
      let sectionInventory = await db.sectionInventory.where({ sectionId, rawMaterialId }).first();

      if (sectionInventory) {
        // Update existing inventory
        await db.sectionInventory.update(sectionInventory.id, {
          quantity: sectionInventory.quantity + quantity,
          lastUpdated: new Date()
        });
      } else {
        // Create new inventory entry
        const newInventory: Omit<SectionInventory, "id" | "createdAt" | "updatedAt"> = {
          sectionId,
          rawMaterialId,
          quantity,
          reservedQuantity: 0,
          lastUpdated: new Date()
        };
        await db.sectionInventory.add(newInventory as SectionInventory);
      }

      // Create stock movement to track the assignment
      await StockAPI.createMovement({
        stockEntryId: "", // This would need to be determined from available stock entries
        type: MovementType.TRANSFER,
        quantity,
        toSectionId: sectionId,
        reason: notes || "Stock assigned to section",
        performedBy: assignedBy
      });

      return {
        data: true,
        success: true,
        message: "Stock assigned to section successfully"
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to assign stock to section"
      };
    }
  }

  // Get section inventory
  static async getSectionInventory(sectionId: string): Promise<ApiResponse<SectionInventory[]>> {
    try {
      const inventory = await db.sectionInventory.where("sectionId").equals(sectionId).toArray();

      // Populate raw material data
      for (const item of inventory) {
        const rawMaterial = await db.rawMaterials.get(item.rawMaterialId);
        if (rawMaterial) {
          item.rawMaterial = rawMaterial;
        }
      }

      return {
        data: inventory,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch section inventory"
      };
    }
  }

  // Record consumption in section
  static async recordConsumption(sectionId: string, rawMaterialId: string, quantity: number, consumedBy: string, reason: string, orderId?: string, notes?: string): Promise<ApiResponse<boolean>> {
    try {
      // Check section inventory
      const sectionInventory = await db.sectionInventory.where({ sectionId, rawMaterialId }).first();

      if (!sectionInventory || sectionInventory.quantity < quantity) {
        throw new Error("Insufficient inventory in section");
      }

      // Update section inventory
      await db.sectionInventory.update(sectionInventory.id, {
        quantity: sectionInventory.quantity - quantity,
        lastUpdated: new Date()
      });

      // Record consumption
      const consumption: Omit<SectionConsumption, "id" | "createdAt" | "updatedAt"> = {
        sectionId,
        rawMaterialId,
        quantity,
        consumedDate: new Date(),
        consumedBy,
        reason,
        orderId,
        notes
      };

      await db.sectionConsumption.add(consumption as SectionConsumption);

      return {
        data: true,
        success: true,
        message: "Consumption recorded successfully"
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to record consumption"
      };
    }
  }

  // Get section consumption history
  static async getSectionConsumption(
    sectionId: string,
    filters?: {
      rawMaterialId?: string;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<ApiResponse<SectionConsumption[]>> {
    try {
      let query = db.sectionConsumption.where("sectionId").equals(sectionId).reverse().sortBy("consumedDate");

      let consumption = await query;

      if (filters?.rawMaterialId) {
        consumption = consumption.filter(item => item.rawMaterialId === filters.rawMaterialId);
      }

      if (filters?.fromDate || filters?.toDate) {
        consumption = consumption.filter(item => {
          const consumedDate = new Date(item.consumedDate);
          if (filters.fromDate && consumedDate < filters.fromDate) return false;
          if (filters.toDate && consumedDate > filters.toDate) return false;
          return true;
        });
      }

      // Populate raw material data
      for (const item of consumption) {
        const rawMaterial = await db.rawMaterials.get(item.rawMaterialId);
        if (rawMaterial) {
          item.rawMaterial = rawMaterial;
        }
      }

      return {
        data: consumption,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch section consumption"
      };
    }
  }
}

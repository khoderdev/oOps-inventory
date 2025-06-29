import { db } from "../lib/database";
import { MeasurementUnit, MovementType, type ApiResponse, type CreateSectionAssignmentInput, type CreateSectionInput, type RawMaterial, type Section, type SectionConsumption, type SectionInventory, type UpdateSectionInput } from "../types";
import { StockAPI } from "./stock.api";
import { generateNextOrderId } from "../utils/orderId";

export class SectionsAPI {
  // Helper function to get pack information from raw material
  private static getPackInfo(rawMaterial: RawMaterial) {
    const isPackOrBox = rawMaterial.unit === MeasurementUnit.PACKS || rawMaterial.unit === MeasurementUnit.BOXES;
    if (!isPackOrBox) return null;
    const material = rawMaterial as unknown as {
      unitsPerPack?: number;
      baseUnit?: MeasurementUnit;
    };

    return {
      unitsPerPack: material.unitsPerPack || 1,
      baseUnit: material.baseUnit || MeasurementUnit.PIECES,
      packUnit: rawMaterial.unit
    };
  }

  // Helper function to convert pack quantity to base units
  private static convertPackToBase(quantity: number, rawMaterial: RawMaterial): number {
    const packInfo = this.getPackInfo(rawMaterial);
    if (!packInfo) return quantity;

    // If it's a pack/box, multiply by units per pack to get base units
    return quantity * packInfo.unitsPerPack;
  }

  // Helper function to convert base units to pack quantity
  private static convertBaseToPack(baseQuantity: number, rawMaterial: RawMaterial): number {
    const packInfo = this.getPackInfo(rawMaterial);
    if (!packInfo) return baseQuantity;

    // If it's a pack/box, divide by units per pack to get pack quantity
    return baseQuantity / packInfo.unitsPerPack;
  }

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

  // Assign stock to section - Enhanced for pack/box handling
  static async assignStock(data: CreateSectionAssignmentInput): Promise<ApiResponse<boolean>> {
    try {
      const { sectionId, rawMaterialId, quantity, assignedBy, notes } = data;

      // Get raw material info for pack conversion
      const rawMaterial = await db.rawMaterials.get(rawMaterialId);
      if (!rawMaterial) {
        throw new Error("Raw material not found");
      }

      // Convert pack quantity to base units if needed
      const baseQuantityToAssign = this.convertPackToBase(quantity, rawMaterial);

      // Check if we have enough stock available (stock is always stored in base units)
      const stockLevel = await StockAPI.getStockLevel(rawMaterialId);
      if (!stockLevel.success || !stockLevel.data) {
        throw new Error("Unable to check stock availability");
      }

      if (stockLevel.data.availableQuantity < baseQuantityToAssign) {
        const packInfo = this.getPackInfo(rawMaterial);
        const availablePacks = packInfo ? this.convertBaseToPack(stockLevel.data.availableQuantity, rawMaterial) : stockLevel.data.availableQuantity;
        const requestedPacks = packInfo ? quantity : baseQuantityToAssign; // Use original quantity for pack display

        throw new Error(packInfo ? `Insufficient stock available. Requested: ${requestedPacks.toFixed(1)} ${rawMaterial.unit}, Available: ${availablePacks.toFixed(1)} ${rawMaterial.unit}` : `Insufficient stock available. Requested: ${baseQuantityToAssign}, Available: ${stockLevel.data.availableQuantity}`);
      }

      // Find an available stock entry to reference for the movement
      const stockEntries = await db.stockEntries.where({ rawMaterialId }).toArray();
      let stockEntryId = "";

      // Find a stock entry that has available quantity
      for (const entry of stockEntries) {
        const entryMovements = await db.stockMovements.where({ stockEntryId: entry.id, type: MovementType.OUT }).toArray();
        const usedQuantity = entryMovements.reduce((sum, movement) => sum + movement.quantity, 0);
        const availableQuantity = entry.quantity - usedQuantity;

        if (availableQuantity > 0) {
          stockEntryId = entry.id;
          break;
        }
      }

      if (!stockEntryId) {
        throw new Error("No available stock entries found for this material");
      }

      // Check if section inventory entry exists
      const sectionInventory = await db.sectionInventory.where({ sectionId, rawMaterialId }).first();

      if (sectionInventory) {
        // Update existing inventory (always store in base units)
        await db.sectionInventory.update(sectionInventory.id, {
          quantity: sectionInventory.quantity + baseQuantityToAssign,
          lastUpdated: new Date()
        });
      } else {
        // Create new inventory entry (store in base units)
        const newInventory: Omit<SectionInventory, "id" | "createdAt" | "updatedAt"> = {
          sectionId,
          rawMaterialId,
          quantity: baseQuantityToAssign,
          reservedQuantity: 0,
          lastUpdated: new Date()
        };
        await db.sectionInventory.add(newInventory as SectionInventory);
      }

      // Create stock movement to track the assignment (store in base units)
      const packInfo = this.getPackInfo(rawMaterial);
      const movementNotes = packInfo ? `${notes || "Stock assigned to section"} (${quantity.toFixed(1)} ${rawMaterial.unit} = ${baseQuantityToAssign} ${packInfo.baseUnit})` : notes || "Stock assigned to section";

      await StockAPI.createMovement({
        stockEntryId,
        type: MovementType.TRANSFER,
        quantity: baseQuantityToAssign, // Always store in base units
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
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to assign stock to section"
      };
    }
  }

  // Get section inventory - Enhanced to include pack information
  static async getSectionInventory(sectionId: string): Promise<ApiResponse<SectionInventory[]>> {
    try {
      const inventory = await db.sectionInventory.where("sectionId").equals(sectionId).toArray();

      // Populate raw material data and add pack conversion info
      for (const item of inventory) {
        const rawMaterial = await db.rawMaterials.get(item.rawMaterialId);
        if (rawMaterial) {
          item.rawMaterial = rawMaterial;

          // Add pack information for display purposes
          const packInfo = this.getPackInfo(rawMaterial);
          if (packInfo) {
            // Add computed properties for easier UI consumption
            (item as unknown as { packQuantity: number; packInfo: { unitsPerPack: number; baseUnit: MeasurementUnit; packUnit: MeasurementUnit } }).packQuantity = this.convertBaseToPack(item.quantity, rawMaterial);
            (item as unknown as { packQuantity: number; packInfo: { unitsPerPack: number; baseUnit: MeasurementUnit; packUnit: MeasurementUnit } }).packInfo = packInfo;
          }
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

  // Record consumption in section - Enhanced for pack/box handling
  static async recordConsumption(
    sectionId: string,
    rawMaterialId: string,
    quantity: number, // Quantity is already in base units from the frontend
    consumedBy: string,
    reason: string,
    orderId?: string,
    notes?: string
  ): Promise<ApiResponse<boolean>> {
    try {
      // Auto-generate order ID if not provided
      let finalOrderId = orderId;
      if (!finalOrderId) {
        try {
          finalOrderId = await generateNextOrderId();
        } catch (error) {
          console.error("Failed to generate order ID for consumption:", error);
          // Continue without order ID if generation fails
        }
      }

      // Get section and raw material
      const section = await db.sections.get(sectionId);
      const rawMaterial = await db.rawMaterials.get(rawMaterialId);

      if (!section) {
        throw new Error("Section not found");
      }

      if (!rawMaterial) {
        throw new Error("Raw material not found");
      }

      // Get current inventory
      const inventory = await db.sectionInventory.where({ sectionId, rawMaterialId }).first();

      if (!inventory) {
        throw new Error("No inventory found for this material in the section");
      }

      // Check if we have enough stock
      if (inventory.quantity < quantity) {
        throw new Error(`Insufficient stock. Available: ${inventory.quantity}, Requested: ${quantity}`);
      }

      // Update inventory (always store in base units)
      const baseQuantityToConsume = quantity;
      await db.sectionInventory.update(inventory.id, {
        quantity: inventory.quantity - baseQuantityToConsume,
        lastUpdated: new Date()
      });

      // Create consumption record with pack info if applicable
      const packInfo = this.getPackInfo(rawMaterial);
      const consumptionNotes = packInfo ? `${notes || reason} (${this.convertBaseToPack(quantity, rawMaterial).toFixed(1)} ${rawMaterial.unit} = ${baseQuantityToConsume} ${packInfo.baseUnit})` : notes || reason;

      // Create consumption record
      const consumption: Omit<SectionConsumption, "id" | "createdAt" | "updatedAt"> = {
        sectionId,
        rawMaterialId,
        quantity: baseQuantityToConsume, // Store in base units
        consumedBy,
        consumedDate: new Date(),
        reason: consumptionNotes,
        orderId: finalOrderId
      };

      await db.sectionConsumption.add(consumption as SectionConsumption);

      // Create stock movement to track consumption for reports
      const stockEntries = await db.stockEntries.where({ rawMaterialId }).toArray();
      let stockEntryId = "";

      // Find a stock entry that has available quantity
      for (const entry of stockEntries) {
        const entryMovements = await db.stockMovements.where({ stockEntryId: entry.id, type: MovementType.OUT }).toArray();
        const usedQuantity = entryMovements.reduce((sum, movement) => sum + movement.quantity, 0);
        const availableQuantity = entry.quantity - usedQuantity;

        if (availableQuantity > 0) {
          stockEntryId = entry.id;
          break;
        }
      }

      if (stockEntryId) {
        try {
          await StockAPI.createMovement({
            stockEntryId,
            type: MovementType.OUT,
            quantity: baseQuantityToConsume,
            fromSectionId: sectionId,
            reason: consumptionNotes,
            performedBy: consumedBy
          });
          console.log("Stock movement created successfully for consumption");
        } catch (error) {
          console.error("Failed to create stock movement for consumption:", error);
        }
      } else {
        console.warn("No available stock entry found for movement creation");
      }

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

  // Get section consumption history - Enhanced to include pack information
  static async getSectionConsumption(
    sectionId: string,
    filters?: {
      rawMaterialId?: string;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<ApiResponse<SectionConsumption[]>> {
    try {
      const query = db.sectionConsumption.where("sectionId").equals(sectionId).reverse().sortBy("consumedDate");

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

      // Populate raw material data and add pack conversion info
      for (const item of consumption) {
        const rawMaterial = await db.rawMaterials.get(item.rawMaterialId);
        if (rawMaterial) {
          item.rawMaterial = rawMaterial;

          // Add pack information for display purposes
          const packInfo = this.getPackInfo(rawMaterial);
          if (packInfo) {
            // Add computed properties for easier UI consumption
            (item as unknown as { packQuantity: number; packInfo: { unitsPerPack: number; baseUnit: MeasurementUnit; packUnit: MeasurementUnit } }).packQuantity = this.convertBaseToPack(item.quantity, rawMaterial);
            (item as unknown as { packQuantity: number; packInfo: { unitsPerPack: number; baseUnit: MeasurementUnit; packUnit: MeasurementUnit } }).packInfo = packInfo;
          }
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

  // Update section inventory assignment
  static async updateSectionInventory(
    inventoryId: string,
    quantity: number, // This could be in pack units, we need to convert
    updatedBy: string,
    notes?: string
  ): Promise<ApiResponse<boolean>> {
    try {
      // Get the current inventory item
      const currentInventory = await db.sectionInventory.get(inventoryId);
      if (!currentInventory) {
        throw new Error("Section inventory not found");
      }

      // Get raw material for pack conversion info
      const rawMaterial = await db.rawMaterials.get(currentInventory.rawMaterialId);
      if (!rawMaterial) {
        throw new Error("Raw material not found");
      }

      // Convert pack quantity to base units if needed
      const baseQuantityToAssign = this.convertPackToBase(quantity, rawMaterial);

      // Check if we have enough stock available (considering current assignment)
      const stockLevel = await StockAPI.getStockLevel(currentInventory.rawMaterialId);
      if (!stockLevel.success || !stockLevel.data) {
        throw new Error("Unable to check stock availability");
      }

      // Calculate how much additional stock we need
      const additionalNeeded = baseQuantityToAssign - currentInventory.quantity;

      if (additionalNeeded > 0) {
        // We need more stock, check if available
        if (stockLevel.data.availableQuantity < additionalNeeded) {
          const packInfo = this.getPackInfo(rawMaterial);
          const availablePacks = packInfo ? this.convertBaseToPack(stockLevel.data.availableQuantity, rawMaterial) : stockLevel.data.availableQuantity;
          const requestedPacks = packInfo ? quantity : baseQuantityToAssign;

          throw new Error(packInfo ? `Insufficient stock available. Requested: ${requestedPacks.toFixed(1)} ${rawMaterial.unit}, Available: ${availablePacks.toFixed(1)} ${rawMaterial.unit}` : `Insufficient stock available. Requested: ${baseQuantityToAssign}, Available: ${stockLevel.data.availableQuantity}`);
        }
      }

      // Update the inventory
      await db.sectionInventory.update(inventoryId, {
        quantity: baseQuantityToAssign,
        lastUpdated: new Date()
      });

      // Create stock movement to track the change
      const packInfo = this.getPackInfo(rawMaterial);
      const movementNotes = packInfo ? `${notes || "Section inventory updated"} (${quantity.toFixed(1)} ${rawMaterial.unit} = ${baseQuantityToAssign} ${packInfo.baseUnit})` : notes || "Section inventory updated";

      // Find an available stock entry to reference for the movement
      const stockEntries = await db.stockEntries.where({ rawMaterialId: currentInventory.rawMaterialId }).toArray();
      let stockEntryId = "";

      for (const entry of stockEntries) {
        const entryMovements = await db.stockMovements.where({ stockEntryId: entry.id, type: MovementType.OUT }).toArray();
        const usedQuantity = entryMovements.reduce((sum, movement) => sum + movement.quantity, 0);
        const availableQuantity = entry.quantity - usedQuantity;

        if (availableQuantity > 0) {
          stockEntryId = entry.id;
          break;
        }
      }

      if (stockEntryId) {
        await StockAPI.createMovement({
          stockEntryId,
          type: MovementType.TRANSFER,
          quantity: Math.abs(additionalNeeded), // Always positive for movement
          toSectionId: currentInventory.sectionId,
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
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to update section inventory"
      };
    }
  }

  // Remove section inventory assignment
  static async removeSectionInventory(inventoryId: string, removedBy: string, notes?: string): Promise<ApiResponse<boolean>> {
    try {
      // Get the current inventory item
      const currentInventory = await db.sectionInventory.get(inventoryId);
      if (!currentInventory) {
        throw new Error("Section inventory not found");
      }

      // Get raw material for display info
      const rawMaterial = await db.rawMaterials.get(currentInventory.rawMaterialId);
      if (!rawMaterial) {
        throw new Error("Raw material not found");
      }

      // Delete the inventory item
      await db.sectionInventory.delete(inventoryId);

      // Create stock movement to track the removal
      const packInfo = this.getPackInfo(rawMaterial);
      const movementNotes = packInfo ? `${notes || "Stock removed from section"} (${this.convertBaseToPack(currentInventory.quantity, rawMaterial).toFixed(1)} ${rawMaterial.unit} = ${currentInventory.quantity} ${packInfo.baseUnit})` : notes || "Stock removed from section";

      // Find an available stock entry to reference for the movement
      const stockEntries = await db.stockEntries.where({ rawMaterialId: currentInventory.rawMaterialId }).toArray();
      let stockEntryId = "";

      for (const entry of stockEntries) {
        const entryMovements = await db.stockMovements.where({ stockEntryId: entry.id, type: MovementType.OUT }).toArray();
        const usedQuantity = entryMovements.reduce((sum, movement) => sum + movement.quantity, 0);
        const availableQuantity = entry.quantity - usedQuantity;

        if (availableQuantity > 0) {
          stockEntryId = entry.id;
          break;
        }
      }

      if (stockEntryId) {
        await StockAPI.createMovement({
          stockEntryId,
          type: MovementType.TRANSFER,
          quantity: currentInventory.quantity,
          fromSectionId: currentInventory.sectionId, // Moving out of section
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
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to remove section inventory"
      };
    }
  }
}

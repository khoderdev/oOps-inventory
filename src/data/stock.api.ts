import { db } from "../lib/database";
import { MeasurementUnit, MovementType, type ApiResponse, type CreateStockEntryInput, type CreateStockMovementInput, type RawMaterial, type StockEntry, type StockLevel, type StockMovement } from "../types";

export class StockAPI {
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

    return quantity * packInfo.unitsPerPack;
  }

  // Helper function to convert base units to pack quantity
  private static convertBaseToPack(baseQuantity: number, rawMaterial: RawMaterial): number {
    const packInfo = this.getPackInfo(rawMaterial);
    if (!packInfo) return baseQuantity;

    return baseQuantity / packInfo.unitsPerPack;
  }

  // Create a new stock entry - Enhanced for pack/box handling
  static async createEntry(data: CreateStockEntryInput): Promise<ApiResponse<StockEntry>> {
    try {
      // Get raw material to understand pack structure
      const rawMaterial = await db.rawMaterials.get(data.rawMaterialId);
      if (!rawMaterial) {
        throw new Error("Raw material not found");
      }

      // Convert pack quantity to base units if needed
      const baseQuantity = this.convertPackToBase(data.quantity, rawMaterial);

      // Calculate costs for pack/box materials
      const packInfo = this.getPackInfo(rawMaterial);
      let enhancedNotes = data.notes || "";
      let unitCost = data.unitCost;
      let totalCost = data.quantity * data.unitCost; // Total cost based on pack/box quantity

      if (packInfo) {
        // For pack/box materials, data.unitCost is cost per pack/box
        // Calculate cost per individual item for detailed tracking
        const individualItemCost = data.unitCost / packInfo.unitsPerPack;
        
        enhancedNotes = `${enhancedNotes} (${data.quantity.toFixed(1)} ${rawMaterial.unit} = ${baseQuantity} ${packInfo.baseUnit}, Pack cost: $${data.unitCost.toFixed(2)}, Individual cost: $${individualItemCost.toFixed(4)})`.trim();
        
        // Store the pack cost as unitCost, but note that totalCost should reflect total pack cost
        unitCost = data.unitCost; // Cost per pack/box
        totalCost = data.quantity * data.unitCost; // Total cost for all packs/boxes
      }

      const stockEntryData = {
        ...data,
        quantity: baseQuantity, // Store in base units
        unitCost: unitCost, // Store pack cost (for pack/box materials)
        totalCost: totalCost, // Total cost for all packs/boxes
        notes: enhancedNotes
      };

      const id = await db.stockEntries.add(stockEntryData as StockEntry);
      const created = await db.stockEntries.get(id);

      if (!created) {
        throw new Error("Failed to create stock entry");
      }

      // Create initial stock movement with pack info
      const movementReason = packInfo ? `Stock received (${data.quantity.toFixed(1)} ${rawMaterial.unit} = ${baseQuantity} ${packInfo.baseUnit})` : "Stock received";

      await this.createMovement({
        stockEntryId: created.id,
        type: MovementType.IN,
        quantity: baseQuantity, // Always store in base units
        reason: movementReason,
        performedBy: data.receivedBy
      });

      return {
        data: created,
        success: true,
        message: "Stock entry created successfully"
      };
    } catch (error) {
      return {
        data: {} as StockEntry,
        success: false,
        message: error instanceof Error ? error.message : "Failed to create stock entry"
      };
    }
  }

  // Create stock movement
  static async createMovement(data: CreateStockMovementInput): Promise<ApiResponse<StockMovement>> {
    try {
      const id = await db.stockMovements.add(data as StockMovement);
      const created = await db.stockMovements.get(id);

      if (!created) {
        throw new Error("Failed to create stock movement");
      }

      return {
        data: created,
        success: true,
        message: "Stock movement created successfully"
      };
    } catch (error) {
      return {
        data: {} as StockMovement,
        success: false,
        message: error instanceof Error ? error.message : "Failed to create stock movement"
      };
    }
  }

  // Get all stock entries with optional filtering
  static async getAllEntries(filters?: { rawMaterialId?: string; supplier?: string; fromDate?: Date; toDate?: Date }): Promise<ApiResponse<StockEntry[]>> {
    try {
      let query = db.stockEntries.orderBy("receivedDate").reverse();

      if (filters?.rawMaterialId) {
        query = query.filter(entry => entry.rawMaterialId === filters.rawMaterialId);
      }

      if (filters?.supplier) {
        query = query.filter(entry => entry.supplier === filters.supplier);
      }

      let entries = await query.toArray();

      if (filters?.fromDate || filters?.toDate) {
        entries = entries.filter(entry => {
          const receivedDate = new Date(entry.receivedDate);
          if (filters.fromDate && receivedDate < filters.fromDate) return false;
          if (filters.toDate && receivedDate > filters.toDate) return false;
          return true;
        });
      }

      return {
        data: entries,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch stock entries"
      };
    }
  }

  // Get stock movements with optional filtering
  static async getMovements(filters?: { stockEntryId?: string; type?: MovementType; fromDate?: Date; toDate?: Date; sectionId?: string }): Promise<ApiResponse<StockMovement[]>> {
    try {
      let query = db.stockMovements.orderBy("createdAt").reverse();

      if (filters?.stockEntryId) {
        query = query.filter(movement => movement.stockEntryId === filters.stockEntryId);
      }

      if (filters?.type) {
        query = query.filter(movement => movement.type === filters.type);
      }

      let movements = await query.toArray();

      if (filters?.fromDate || filters?.toDate) {
        movements = movements.filter(movement => {
          const createdDate = new Date(movement.createdAt);
          if (filters.fromDate && createdDate < filters.fromDate) return false;
          if (filters.toDate && createdDate > filters.toDate) return false;
          return true;
        });
      }

      if (filters?.sectionId) {
        movements = movements.filter(movement => movement.fromSectionId === filters.sectionId || movement.toSectionId === filters.sectionId);
      }

      return {
        data: movements,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch stock movements"
      };
    }
  }

  // Calculate current stock levels
  static async getCurrentStockLevels(): Promise<ApiResponse<StockLevel[]>> {
    try {
      const entries = await db.stockEntries.toArray();
      const movements = await db.stockMovements.toArray();
      const rawMaterials = await db.rawMaterials.filter(material => material.isActive === true).toArray();

      const stockLevels: StockLevel[] = [];

      for (const material of rawMaterials) {
        const materialEntries = entries.filter(entry => entry.rawMaterialId === material.id);

        let totalReceived = 0;
        let totalUsed = 0;

        for (const entry of materialEntries) {
          totalReceived += entry.quantity;

          const entryMovements = movements.filter(movement => movement.stockEntryId === entry.id && movement.type === MovementType.OUT);

          totalUsed += entryMovements.reduce((sum, movement) => sum + movement.quantity, 0);
        }

        const availableQuantity = totalReceived - totalUsed;
        const isLowStock = availableQuantity <= material.minStockLevel;

        stockLevels.push({
          rawMaterialId: material.id,
          rawMaterial: material,
          totalQuantity: totalReceived,
          availableQuantity,
          reservedQuantity: 0, // Would be calculated based on pending orders
          minLevel: material.minStockLevel,
          maxLevel: material.maxStockLevel,
          isLowStock,
          lastUpdated: new Date()
        });
      }

      return {
        data: stockLevels,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to calculate stock levels"
      };
    }
  }

  // Get stock level for specific material
  static async getStockLevel(rawMaterialId: string): Promise<ApiResponse<StockLevel | null>> {
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
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to get stock level"
      };
    }
  }

  // Transfer stock between sections
  static async transferStock(stockEntryId: string, fromSectionId: string, toSectionId: string, quantity: number, performedBy: string, reason: string): Promise<ApiResponse<boolean>> {
    try {
      await this.createMovement({
        stockEntryId,
        type: MovementType.TRANSFER,
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
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to transfer stock"
      };
    }
  }

  // Update stock entry
  static async updateEntry(data: { id: string; rawMaterialId?: string; quantity?: number; unitCost?: number; supplier?: string; batchNumber?: string; expiryDate?: Date; receivedDate?: Date; receivedBy?: string; notes?: string }): Promise<ApiResponse<StockEntry>> {
    try {
      const existingEntry = await db.stockEntries.get(data.id);
      if (!existingEntry) {
        throw new Error("Stock entry not found");
      }

      // Get raw material to understand pack structure if material is being changed
      let rawMaterial = existingEntry.rawMaterialId ? await db.rawMaterials.get(existingEntry.rawMaterialId) : null;
      if (data.rawMaterialId && data.rawMaterialId !== existingEntry.rawMaterialId) {
        rawMaterial = await db.rawMaterials.get(data.rawMaterialId);
        if (!rawMaterial) {
          throw new Error("Raw material not found");
        }
      }

      // Convert pack quantity to base units if needed and material is pack/box type
      let quantity = data.quantity;
      if (quantity !== undefined && rawMaterial) {
        quantity = this.convertPackToBase(quantity, rawMaterial);
      }

      // Calculate costs for pack/box materials
      let notes = data.notes;
      let unitCost = data.unitCost;
      let totalCost = undefined;
      
      if (rawMaterial && (data.quantity !== undefined || data.unitCost !== undefined)) {
        const packInfo = this.getPackInfo(rawMaterial);
        if (packInfo && (data.quantity !== undefined || data.unitCost !== undefined)) {
          const finalQuantity = data.quantity !== undefined ? data.quantity : this.convertBaseToPack(existingEntry.quantity, rawMaterial);
          const finalUnitCost = data.unitCost !== undefined ? data.unitCost : existingEntry.unitCost;
          
          // Calculate cost per individual item for detailed tracking
          const individualItemCost = finalUnitCost / packInfo.unitsPerPack;
          const baseQuantity = this.convertPackToBase(finalQuantity, rawMaterial);
          
          notes = `${notes || existingEntry.notes || ""} (${finalQuantity.toFixed(1)} ${rawMaterial.unit} = ${baseQuantity} ${packInfo.baseUnit}, Pack cost: $${finalUnitCost.toFixed(2)}, Individual cost: $${individualItemCost.toFixed(4)})`.trim();
          
          unitCost = finalUnitCost; // Cost per pack/box
          totalCost = finalQuantity * finalUnitCost; // Total cost for all packs/boxes
        }
      }

      const updateData: Partial<StockEntry> = {
        ...data,
        quantity: quantity !== undefined ? quantity : existingEntry.quantity,
        unitCost: unitCost !== undefined ? unitCost : existingEntry.unitCost,
        totalCost: totalCost !== undefined ? totalCost : existingEntry.totalCost,
        notes: notes !== undefined ? notes : existingEntry.notes
      };

      // Calculate total cost if quantity or unit cost is being updated (for non-pack materials)
      if ((updateData.quantity !== undefined || updateData.unitCost !== undefined) && !totalCost) {
        const finalQuantity = updateData.quantity ?? existingEntry.quantity;
        const finalUnitCost = updateData.unitCost ?? existingEntry.unitCost;
        updateData.totalCost = finalQuantity * finalUnitCost;
      }

      await db.stockEntries.update(data.id, updateData);
      const updated = await db.stockEntries.get(data.id);

      if (!updated) {
        throw new Error("Failed to update stock entry");
      }

      return {
        data: updated,
        success: true,
        message: "Stock entry updated successfully"
      };
    } catch (error) {
      return {
        data: {} as StockEntry,
        success: false,
        message: error instanceof Error ? error.message : "Failed to update stock entry"
      };
    }
  }

  // Delete stock entry
  static async deleteEntry(id: string): Promise<ApiResponse<boolean>> {
    try {
      const existingEntry = await db.stockEntries.get(id);
      if (!existingEntry) {
        throw new Error("Stock entry not found");
      }

      // Check if there are any movements associated with this entry
      const movements = await db.stockMovements.filter(movement => movement.stockEntryId === id).toArray();
      if (movements.length > 0) {
        throw new Error("Cannot delete stock entry with associated movements. Please delete movements first.");
      }

      await db.stockEntries.delete(id);

      return {
        data: true,
        success: true,
        message: "Stock entry deleted successfully"
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete stock entry"
      };
    }
  }
}

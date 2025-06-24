import { db } from "../lib/database";
import { MovementType, type ApiResponse, type CreateStockEntryInput, type CreateStockMovementInput, type StockEntry, type StockLevel, type StockMovement } from "../types";

export class StockAPI {
  // Create a new stock entry
  static async createEntry(data: CreateStockEntryInput): Promise<ApiResponse<StockEntry>> {
    try {
      const id = await db.stockEntries.add(data as StockEntry);
      const created = await db.stockEntries.get(id);

      if (!created) {
        throw new Error("Failed to create stock entry");
      }

      // Create initial stock movement
      await this.createMovement({
        stockEntryId: created.id,
        type: MovementType.IN,
        quantity: data.quantity,
        reason: "Stock received",
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
}

import { apiClient } from "../lib/api";
import { MeasurementUnit, MovementType, type ApiResponse, type CreateStockEntryInput, type CreateStockMovementInput, type RawMaterial, type StockEntry, type StockLevel, type StockMovement } from "../types";

// Stock API filters interfaces
export interface StockEntryFilters {
  rawMaterialId?: string;
  supplier?: string;
  fromDate?: string;
  toDate?: string;
}

export interface StockMovementFilters {
  stockEntryId?: string;
  type?: MovementType;
  fromDate?: string;
  toDate?: string;
  sectionId?: string;
}

export interface StockTransferRequest {
  fromSectionId: string;
  toSectionId: string;
  items: Array<{
    stockEntryId: string;
    quantity: number;
  }>;
  reason: string;
  performedBy: string;
}

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

  /**
   * Create a new stock entry
   * POST /api/stock/entries
   */
  static async createEntry(data: CreateStockEntryInput): Promise<ApiResponse<StockEntry>> {
    try {
      return await apiClient.post<StockEntry>("/stock/entries", data);
    } catch (error) {
      return {
        data: {} as StockEntry,
        success: false,
        message: error instanceof Error ? error.message : "Failed to create stock entry"
      };
    }
  }

  /**
   * Create stock movement
   * POST /api/stock/movements
   */
  static async createMovement(data: CreateStockMovementInput): Promise<ApiResponse<StockMovement>> {
    try {
      return await apiClient.post<StockMovement>("/stock/movements", data);
    } catch (error) {
      return {
        data: {} as StockMovement,
        success: false,
        message: error instanceof Error ? error.message : "Failed to create stock movement"
      };
    }
  }

  /**
   * Get all stock entries with optional filtering
   * GET /api/stock/entries
   */
  static async getAllEntries(filters?: StockEntryFilters): Promise<ApiResponse<StockEntry[]>> {
    try {
      let endpoint = "/stock/entries";
      const params = new URLSearchParams();

      if (filters?.rawMaterialId) {
        params.append("rawMaterialId", filters.rawMaterialId);
      }

      if (filters?.supplier) {
        params.append("supplier", filters.supplier);
      }

      if (filters?.fromDate) {
        params.append("fromDate", filters.fromDate);
      }

      if (filters?.toDate) {
        params.append("toDate", filters.toDate);
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      return await apiClient.get<StockEntry[]>(endpoint);
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch stock entries"
      };
    }
  }

  /**
   * Get stock movements with optional filtering
   * GET /api/stock/movements
   */
  static async getMovements(filters?: StockMovementFilters): Promise<ApiResponse<StockMovement[]>> {
    try {
      let endpoint = "/stock/movements";
      const params = new URLSearchParams();

      if (filters?.stockEntryId) {
        params.append("stockEntryId", filters.stockEntryId);
      }

      if (filters?.type) {
        params.append("type", filters.type);
      }

      if (filters?.fromDate) {
        params.append("fromDate", filters.fromDate);
      }

      if (filters?.toDate) {
        params.append("toDate", filters.toDate);
      }

      if (filters?.sectionId) {
        params.append("sectionId", filters.sectionId);
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      return await apiClient.get<StockMovement[]>(endpoint);
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch stock movements"
      };
    }
  }

  /**
   * Calculate current stock levels
   * GET /api/stock/levels
   */
  static async getCurrentStockLevels(): Promise<ApiResponse<StockLevel[]>> {
    try {
      return await apiClient.get<StockLevel[]>("/stock/levels");
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to calculate stock levels"
      };
    }
  }

  /**
   * Get stock level for specific material
   * GET /api/stock/levels/:rawMaterialId
   */
  static async getStockLevel(rawMaterialId: string): Promise<ApiResponse<StockLevel | null>> {
    try {
      const response = await apiClient.get<StockLevel>(`/stock/levels/${rawMaterialId}`);

      return {
        data: response.success ? response.data : null,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to get stock level"
      };
    }
  }

  /**
   * Transfer stock between sections
   * POST /api/stock/transfer
   */
  static async transferStock(stockEntryId: string, fromSectionId: string, toSectionId: string, quantity: number, performedBy: string, reason: string): Promise<ApiResponse<boolean>> {
    try {
      const transferData: StockTransferRequest = {
        fromSectionId,
        toSectionId,
        items: [{ stockEntryId, quantity }],
        reason,
        performedBy
      };

      const response = await apiClient.post<{ success: boolean; message: string }>("/stock/transfer", transferData);

      return {
        data: response.success,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to transfer stock"
      };
    }
  }

  /**
   * Update stock entry
   * PUT /api/stock/entries/:id
   */
  static async updateEntry(data: { id: string; rawMaterialId?: string; quantity?: number; unitCost?: number; supplier?: string; batchNumber?: string; expiryDate?: Date; receivedDate?: Date; receivedBy?: string; notes?: string }): Promise<ApiResponse<StockEntry>> {
    try {
      const { id, ...updateData } = data;
      return await apiClient.put<StockEntry>(`/stock/entries/${id}`, updateData);
    } catch (error) {
      return {
        data: {} as StockEntry,
        success: false,
        message: error instanceof Error ? error.message : "Failed to update stock entry"
      };
    }
  }

  /**
   * Delete stock entry
   * DELETE /api/stock/entries/:id
   */
  static async deleteEntry(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/stock/entries/${id}`);

      return {
        data: response.success,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete stock entry"
      };
    }
  }

  /**
   * Get stock entry by ID
   * GET /api/stock/entries/:id
   */
  static async getEntryById(id: string): Promise<ApiResponse<StockEntry | null>> {
    try {
      const response = await apiClient.get<StockEntry>(`/stock/entries/${id}`);

      return {
        data: response.success ? response.data : null,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch stock entry"
      };
    }
  }

  /**
   * Get stock movement by ID
   * GET /api/stock/movements/:id
   */
  static async getMovementById(id: string): Promise<ApiResponse<StockMovement | null>> {
    try {
      const response = await apiClient.get<StockMovement>(`/stock/movements/${id}`);

      return {
        data: response.success ? response.data : null,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch stock movement"
      };
    }
  }
}

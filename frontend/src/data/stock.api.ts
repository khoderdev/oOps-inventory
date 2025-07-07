import { apiClient } from "../lib/api";
import { type ApiResponse, type ConsumptionReportData, type CreateStockEntryInput, type CreateStockMovementInput, type ExpenseReportData, type LowStockReportData, type ReportsData, type StockEntry, type StockEntryFilters, type StockLevel, type StockMovement, type StockMovementFilters, type StockTransferRequest } from "../types";

export class StockAPI {
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
  static async deleteEntry(id: string, force: boolean = false): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/stock/entries/${id}?force=${force}`);

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

  /**
   * Get comprehensive reports data
   * GET /api/stock/reports
   */
  static async getReportsData(dateRange: number = 30, sectionId?: string): Promise<ApiResponse<ReportsData>> {
    try {
      const params = new URLSearchParams();
      params.append("dateRange", dateRange.toString());
      if (sectionId) {
        params.append("sectionId", sectionId);
      }

      const endpoint = `/stock/reports?${params.toString()}`;
      return await apiClient.get<ReportsData>(endpoint);
    } catch (error) {
      return {
        data: {} as ReportsData,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch reports data"
      };
    }
  }

  /**
   * Get consumption report data
   * GET /api/stock/reports/consumption
   */
  static async getConsumptionReport(dateRange: number = 30, sectionId?: string): Promise<ApiResponse<ConsumptionReportData>> {
    try {
      const params = new URLSearchParams();
      params.append("dateRange", dateRange.toString());
      if (sectionId) {
        params.append("sectionId", sectionId);
      }

      const endpoint = `/stock/reports/consumption?${params.toString()}`;
      return await apiClient.get<ConsumptionReportData>(endpoint);
    } catch (error) {
      return {
        data: {} as ConsumptionReportData,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch consumption report"
      };
    }
  }

  /**
   * Get expense report data
   * GET /api/stock/reports/expenses
   */
  static async getExpenseReport(dateRange: number = 30): Promise<ApiResponse<ExpenseReportData>> {
    try {
      const params = new URLSearchParams();
      params.append("dateRange", dateRange.toString());

      const endpoint = `/stock/reports/expenses?${params.toString()}`;
      return await apiClient.get<ExpenseReportData>(endpoint);
    } catch (error) {
      return {
        data: {} as ExpenseReportData,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch expense report"
      };
    }
  }

  /**
   * Get low stock report data
   * GET /api/stock/reports/low-stock
   */
  static async getLowStockReport(): Promise<ApiResponse<LowStockReportData>> {
    try {
      return await apiClient.get<LowStockReportData>("/stock/reports/low-stock");
    } catch (error) {
      return {
        data: {} as LowStockReportData,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch low stock report"
      };
    }
  }
}

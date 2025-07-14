import { apiClient } from "../lib/api";
import type { ApiResponse } from "../types";
import type { PosSale } from "../types/pos.types";

/**
 * Record a new POS sale
 * POST /api/pos/sales
 */
export class PosSalesAPI {
  static async create(data: {
    sectionId: number;
    cashierId: number;
    items: Array<{
      id: string;
      type: "item" | "recipe";
      name: string;
      price: number;
      quantity: number;
      cost: number;
    }>;
    subtotal: number;
    total: number;
    tax?: number;
    paymentMethod: "CASH" | "CARD";
    status?: string;
    saleDate?: Date;
  }): Promise<ApiResponse<PosSale>> {
    try {
      // Ensure proper data formatting
      const requestData = {
        ...data,
        items: data.items.map(item => ({
          ...item,
          type: item.type.toUpperCase() as "ITEM" | "RECIPE"
        })),
        status: data.status || "COMPLETED",
        saleDate: data.saleDate || new Date()
      };

      const response = await apiClient.post<PosSale>("/pos/sales", requestData);

      if (!response.success) {
        throw new Error(response.message);
      }

      return {
        data: response.data,
        success: true,
        message: "Sale recorded successfully"
      };
    } catch (error) {
      return {
        data: {} as PosSale,
        success: false,
        message: error instanceof Error ? error.message : "Failed to record POS sale"
      };
    }
  }

  /**
   * Get all recorded POS sales (for admin/history screens)
   * GET /api/pos/sales
   */
  static async getAll(params?: { startDate?: Date; endDate?: Date; sectionId?: number; cashierId?: number }): Promise<ApiResponse<PosSale[]>> {
    try {
      // Build query string for filtering
      const queryString = new URLSearchParams();

      if (params?.startDate) queryString.append("startDate", params.startDate.toISOString());
      if (params?.endDate) queryString.append("endDate", params.endDate.toISOString());
      if (params?.sectionId) queryString.append("sectionId", params.sectionId.toString());
      if (params?.cashierId) queryString.append("cashierId", params.cashierId.toString());

      const endpoint = `/pos/sales${queryString.toString() ? `?${queryString.toString()}` : ""}`;
      const response = await apiClient.get<PosSale[]>(endpoint);

      return {
        data: response.data,
        success: response.success,
        message: response.message || "Sales fetched successfully"
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch POS sales"
      };
    }
  }

  /**
   * Get a specific sale by ID with detailed information
   * GET /api/pos/sales/:id
   */
  static async getById(id: string): Promise<ApiResponse<PosSale | null>> {
    try {
      const response = await apiClient.get<PosSale>(`/pos/sales/${id}?includeItems=true&includeCashier=true&includeSection=true`);

      return {
        data: response.data,
        success: response.success,
        message: response.message || "Sale fetched successfully"
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch POS sale"
      };
    }
  }

  /**
   * Delete a sale by ID
   * DELETE /api/pos/sales/:id
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/pos/sales/${id}`);

      return {
        data: response.data?.success || false,
        success: response.success,
        message: response.message || "Sale deleted successfully"
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete POS sale"
      };
    }
  }
}

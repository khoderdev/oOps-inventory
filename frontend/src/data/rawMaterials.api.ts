import { apiClient } from "../lib/api";
import type { ApiResponse, CreateRawMaterialInput, RawMaterial, UpdateRawMaterialInput } from "../types";

// Raw Materials API filters interface
export interface RawMaterialFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
}

export class RawMaterialsAPI {
  /**
   * Create a new raw material
   * POST /api/raw-materials
   */
  static async create(data: CreateRawMaterialInput): Promise<ApiResponse<RawMaterial>> {
    try {
      return await apiClient.post<RawMaterial>("/raw-materials", data);
    } catch (error) {
      return {
        data: {} as RawMaterial,
        success: false,
        message: error instanceof Error ? error.message : "Failed to create raw material"
      };
    }
  }

  /**
   * Get all raw materials with optional filtering
   * GET /api/raw-materials
   */
  static async getAll(filters?: RawMaterialFilters): Promise<ApiResponse<RawMaterial[]>> {
    try {
      let endpoint = "/raw-materials";
      const params = new URLSearchParams();

      if (filters?.category) {
        params.append("category", filters.category);
      }

      if (filters?.isActive !== undefined) {
        params.append("isActive", filters.isActive.toString());
      }

      if (filters?.search) {
        params.append("search", filters.search);
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      return await apiClient.get<RawMaterial[]>(endpoint);
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch raw materials"
      };
    }
  }

  /**
   * Get raw material by ID
   * GET /api/raw-materials/:id
   */
  static async getById(id: string): Promise<ApiResponse<RawMaterial | null>> {
    try {
      const response = await apiClient.get<RawMaterial>(`/raw-materials/${id}`);

      return {
        data: response.success ? response.data : null,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch raw material"
      };
    }
  }

  /**
   * Update raw material
   * PUT /api/raw-materials/:id
   */
  static async update(data: UpdateRawMaterialInput): Promise<ApiResponse<RawMaterial>> {
    try {
      const { id, ...updateData } = data;
      return await apiClient.put<RawMaterial>(`/raw-materials/${id}`, updateData);
    } catch (error) {
      return {
        data: {} as RawMaterial,
        success: false,
        message: error instanceof Error ? error.message : "Failed to update raw material"
      };
    }
  }

  /**
   * Delete raw material (soft delete by setting isActive to false)
   * DELETE /api/raw-materials/:id
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/raw-materials/${id}`);

      return {
        data: response.success,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete raw material"
      };
    }
  }

  /**
   * Get low stock materials
   * GET /api/raw-materials/low-stock
   */
  static async getLowStock(): Promise<ApiResponse<RawMaterial[]>> {
    try {
      return await apiClient.get<RawMaterial[]>("/raw-materials/low-stock");
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch low stock materials"
      };
    }
  }

  /**
   * Get materials by category
   * GET /api/raw-materials/category/:category
   */
  static async getByCategory(category: string): Promise<ApiResponse<RawMaterial[]>> {
    try {
      return await apiClient.get<RawMaterial[]>(`/raw-materials/category/${encodeURIComponent(category)}`);
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch materials by category"
      };
    }
  }

  /**
   * Get all categories
   * Derived from all raw materials
   */
  static async getCategories(): Promise<ApiResponse<string[]>> {
    try {
      const response = await this.getAll({ isActive: true });

      if (!response.success) {
        return {
          data: [],
          success: false,
          message: response.message
        };
      }

      // Extract unique categories
      const categories = [...new Set(response.data.map(material => material.category).filter(Boolean))];

      return {
        data: categories,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch categories"
      };
    }
  }
}

import { apiClient } from "../lib/api";
import type { ApiResponse, CreateRawMaterialInput, RawMaterial, UpdateRawMaterialInput } from "../types";

export interface RawMaterialFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
}

export class RawMaterialsAPI {
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

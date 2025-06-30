import { apiClient } from "../lib/api";
import { type ApiResponse, type CreateSectionAssignmentInput, type CreateSectionInput, type RawMaterial, type Section, type SectionConsumption, type SectionInventory, type UpdateSectionInput } from "../types";

// Sections API filters interfaces
export interface SectionFilters {
  type?: string;
  isActive?: boolean;
  managerId?: string;
}

export interface SectionConsumptionFilters {
  rawMaterialId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ConsumptionRequest {
  sectionId: string;
  rawMaterialId: string;
  quantity: number;
  consumedBy: string;
  reason: string;
  orderId?: string;
  notes?: string;
}

export interface InventoryUpdateRequest {
  inventoryId: string;
  quantity: number;
  updatedBy: string;
  notes?: string;
}

export class SectionsAPI {
  /**
   * Create a new section
   * POST /api/sections
   */
  static async create(data: CreateSectionInput): Promise<ApiResponse<Section>> {
    try {
      // Transform data to match backend expectations
      const transformedData = {
        ...data,
        type: data.type.toUpperCase() // Ensure type is uppercase for database enum
      };

      return await apiClient.post<Section>("/sections", transformedData);
    } catch (error) {
      return {
        data: {} as Section,
        success: false,
        message: error instanceof Error ? error.message : "Failed to create section"
      };
    }
  }

  /**
   * Get all sections with optional filtering
   * GET /api/sections
   */
  static async getAll(filters?: SectionFilters): Promise<ApiResponse<Section[]>> {
    try {
      let endpoint = "/sections";
      const params = new URLSearchParams();

      if (filters?.type) {
        params.append("type", filters.type);
      }

      if (filters?.isActive !== undefined) {
        params.append("isActive", filters.isActive.toString());
      }

      if (filters?.managerId) {
        params.append("managerId", filters.managerId);
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      return await apiClient.get<Section[]>(endpoint);
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch sections"
      };
    }
  }

  /**
   * Get section by ID
   * GET /api/sections/:id
   */
  static async getById(id: string): Promise<ApiResponse<Section | null>> {
    try {
      const response = await apiClient.get<Section>(`/sections/${id}`);

      return {
        data: response.success ? response.data : null,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch section"
      };
    }
  }

  /**
   * Update section
   * PUT /api/sections/:id
   */
  static async update(data: UpdateSectionInput): Promise<ApiResponse<Section>> {
    try {
      const { id, ...updateData } = data;

      // Transform data to match backend expectations
      const transformedData = {
        ...updateData,
        type: updateData.type ? updateData.type.toUpperCase() : updateData.type // Ensure type is uppercase for database enum
      };

      return await apiClient.put<Section>(`/sections/${id}`, transformedData);
    } catch (error) {
      return {
        data: {} as Section,
        success: false,
        message: error instanceof Error ? error.message : "Failed to update section"
      };
    }
  }

  /**
   * Delete section (soft delete)
   * DELETE /api/sections/:id
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/sections/${id}`);

      return {
        data: response.success,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete section"
      };
    }
  }

  /**
   * Assign stock to section
   * POST /api/sections/:id/assign-stock
   */
  static async assignStock(data: CreateSectionAssignmentInput): Promise<ApiResponse<boolean>> {
    try {
      const { sectionId, ...assignmentData } = data;
      const response = await apiClient.post<{ success: boolean; message: string }>(`/sections/${sectionId}/assign-stock`, assignmentData);

      return {
        data: response.success,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to assign stock to section"
      };
    }
  }

  /**
   * Get section inventory
   * GET /api/sections/:id/inventory
   */
  static async getSectionInventory(sectionId: string): Promise<ApiResponse<SectionInventory[]>> {
    try {
      return await apiClient.get<SectionInventory[]>(`/sections/${sectionId}/inventory`);
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch section inventory"
      };
    }
  }

  /**
   * Record consumption from section
   * POST /api/sections/:id/consume
   */
  static async recordConsumption(sectionId: string, rawMaterialId: string, quantity: number, consumedBy: string, reason: string, orderId?: string, notes?: string): Promise<ApiResponse<boolean>> {
    try {
      const consumptionData: Omit<ConsumptionRequest, "sectionId"> = {
        rawMaterialId,
        quantity,
        consumedBy,
        reason,
        orderId,
        notes
      };

      const response = await apiClient.post<{ success: boolean; message: string }>(`/sections/${sectionId}/consume`, consumptionData);

      return {
        data: response.success,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to record consumption"
      };
    }
  }

  /**
   * Get section consumption history
   * GET /api/sections/:id/consumption
   */
  static async getSectionConsumption(sectionId: string, filters?: SectionConsumptionFilters): Promise<ApiResponse<SectionConsumption[]>> {
    try {
      let endpoint = `/sections/${sectionId}/consumption`;
      const params = new URLSearchParams();

      if (filters?.rawMaterialId) {
        params.append("rawMaterialId", filters.rawMaterialId);
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

      return await apiClient.get<SectionConsumption[]>(endpoint);
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch section consumption"
      };
    }
  }

  /**
   * Update section inventory quantity
   * PUT /api/sections/:id/inventory/:inventoryId
   */
  static async updateSectionInventory(inventoryId: string, quantity: number, updatedBy: string, notes?: string): Promise<ApiResponse<boolean>> {
    try {
      // Extract section ID from inventory ID (assuming format sectionId-inventoryId or similar)
      // This might need adjustment based on actual ID structure
      const updateData: Omit<InventoryUpdateRequest, "inventoryId"> = {
        quantity,
        updatedBy,
        notes
      };

      const response = await apiClient.put<{ success: boolean; message: string }>(`/sections/inventory/${inventoryId}`, updateData);

      return {
        data: response.success,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to update section inventory"
      };
    }
  }

  /**
   * Remove item from section inventory
   * DELETE /api/sections/inventory/:inventoryId
   */
  static async removeSectionInventory(inventoryId: string, removedBy: string, notes?: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/sections/inventory/${inventoryId}?removedBy=${removedBy}&notes=${notes || ""}`);

      return {
        data: response.success,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to remove section inventory"
      };
    }
  }

  /**
   * Get available materials for section assignment
   * Helper method to get materials that have available stock
   */
  static async getAvailableMaterials(): Promise<ApiResponse<RawMaterial[]>> {
    try {
      // This could be enhanced to call a specific endpoint that returns materials with stock
      return await apiClient.get<RawMaterial[]>("/raw-materials?isActive=true");
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch available materials"
      };
    }
  }

  /**
   * Get section types
   * Helper method to get available section types
   */
  static async getSectionTypes(): Promise<ApiResponse<string[]>> {
    try {
      const response = await this.getAll({ isActive: true });

      if (!response.success) {
        return {
          data: [],
          success: false,
          message: response.message
        };
      }

      // Extract unique types
      const types = [...new Set(response.data.map(section => section.type).filter(Boolean))];

      return {
        data: types,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch section types"
      };
    }
  }
}

import { apiClient } from "../lib/api";
import { type ApiResponse, type ConsumptionRequest, type CreateSectionAssignmentInput, type CreateSectionInput, type CreateSectionRecipeAssignmentInput, type InventoryUpdateRequest, type RawMaterial, type Section, type SectionConsumption, type SectionConsumptionFilters, type SectionFilters, type SectionInventory, type SectionRecipe, type UpdateSectionInput } from "../types";

export class SectionsAPI {
  static async create(data: CreateSectionInput): Promise<ApiResponse<Section>> {
    try {
      const transformedData = {
        ...data,
        type: data.type.toUpperCase()
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
        params.append("managerId", filters.managerId.toString());
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

  static async update(data: UpdateSectionInput): Promise<ApiResponse<Section>> {
    try {
      const { id, ...updateData } = data;

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

  static async assignRecipe(data: CreateSectionRecipeAssignmentInput): Promise<ApiResponse<boolean>> {
    try {
      const { sectionId, ...assignmentData } = data;
      const response = await apiClient.post<{ success: boolean; message: string }>(`/sections/${sectionId}/assign-recipe`, assignmentData);

      return {
        data: response.success,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to assign recipe to section"
      };
    }
  }

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

  static async getSectionRecipes(sectionId: string): Promise<ApiResponse<SectionRecipe[]>> {
    try {
      return await apiClient.get<SectionRecipe[]>(`/sections/${sectionId}/recipes`);
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch section recipes"
      };
    }
  }

  static async recordConsumption(sectionId: string, rawMaterialId: string, quantity: number, consumedBy: string, reason: string, orderId?: string, notes?: string): Promise<ApiResponse<boolean>> {
    try {
      const consumptionData: Omit<ConsumptionRequest, "sectionId"> = {
        rawMaterialId: parseInt(rawMaterialId),
        quantity,
        consumedBy: parseInt(consumedBy),
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

  static async getSectionConsumption(sectionId: string, filters?: SectionConsumptionFilters): Promise<ApiResponse<SectionConsumption[]>> {
    try {
      let endpoint = `/sections/${sectionId}/consumption`;
      const params = new URLSearchParams();

      if (filters?.rawMaterialId) {
        params.append("rawMaterialId", filters.rawMaterialId.toString());
      }

      if (filters?.fromDate) {
        params.append("fromDate", filters.fromDate.toString());
      }

      if (filters?.toDate) {
        params.append("toDate", filters.toDate.toString());
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

  static async updateSectionInventory(inventoryId: string, quantity: number, updatedBy: string, notes?: string): Promise<ApiResponse<boolean>> {
    try {
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

  static async removeSectionInventory(inventoryId: string, removedBy: string, notes?: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/sections/inventory/${inventoryId}`, {
        removedBy,
        notes
      });

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

  static async getAvailableMaterials(): Promise<ApiResponse<RawMaterial[]>> {
    try {
      return await apiClient.get<RawMaterial[]>("/raw-materials");
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch available materials"
      };
    }
  }

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

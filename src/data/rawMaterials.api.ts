import { db } from "../lib/database";
import type { RawMaterial, CreateRawMaterialInput, UpdateRawMaterialInput, ApiResponse, PaginatedResponse } from "../types";

export class RawMaterialsAPI {
  // Create a new raw material
  static async create(data: CreateRawMaterialInput): Promise<ApiResponse<RawMaterial>> {
    try {
      const newMaterial: Omit<RawMaterial, "id" | "createdAt" | "updatedAt"> = {
        ...data,
        isActive: true
      };

      const id = await db.rawMaterials.add(newMaterial as RawMaterial);
      const created = await db.rawMaterials.get(id);

      if (!created) {
        throw new Error("Failed to create raw material");
      }

      return {
        data: created,
        success: true,
        message: "Raw material created successfully"
      };
    } catch (error) {
      return {
        data: {} as RawMaterial,
        success: false,
        message: error instanceof Error ? error.message : "Failed to create raw material"
      };
    }
  }

  // Get all raw materials with optional filtering
  static async getAll(filters?: { category?: string; isActive?: boolean; search?: string }): Promise<ApiResponse<RawMaterial[]>> {
    try {
      let query = db.rawMaterials.orderBy("name");

      if (filters?.isActive !== undefined) {
        query = query.filter(material => material.isActive === filters.isActive);
      }

      if (filters?.category) {
        query = query.filter(material => material.category === filters.category);
      }

      let materials = await query.toArray();

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        materials = materials.filter(material => material.name.toLowerCase().includes(searchTerm) || material.description?.toLowerCase().includes(searchTerm) || material.supplier?.toLowerCase().includes(searchTerm));
      }

      return {
        data: materials,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch raw materials"
      };
    }
  }

  // Get raw material by ID
  static async getById(id: string): Promise<ApiResponse<RawMaterial | null>> {
    try {
      const material = await db.rawMaterials.get(id);
      return {
        data: material || null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch raw material"
      };
    }
  }

  // Update raw material
  static async update(data: UpdateRawMaterialInput): Promise<ApiResponse<RawMaterial>> {
    try {
      const { id, ...updateData } = data;
      await db.rawMaterials.update(id, updateData);

      const updated = await db.rawMaterials.get(id);
      if (!updated) {
        throw new Error("Raw material not found after update");
      }

      return {
        data: updated,
        success: true,
        message: "Raw material updated successfully"
      };
    } catch (error) {
      return {
        data: {} as RawMaterial,
        success: false,
        message: error instanceof Error ? error.message : "Failed to update raw material"
      };
    }
  }

  // Delete raw material (soft delete by setting isActive to false)
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      await db.rawMaterials.update(id, { isActive: false });
      return {
        data: true,
        success: true,
        message: "Raw material deleted successfully"
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete raw material"
      };
    }
  }

  // Get low stock materials
  static async getLowStock(): Promise<ApiResponse<RawMaterial[]>> {
    try {
      // This would require joining with current stock levels
      // For now, return materials that might be low based on min levels
      const materials = await db.rawMaterials.filter(material => material.isActive && material.minStockLevel > 0).toArray();

      return {
        data: materials,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch low stock materials"
      };
    }
  }

  // Get materials by category
  static async getByCategory(category: string): Promise<ApiResponse<RawMaterial[]>> {
    try {
      const materials = await db.rawMaterials
        .where("category")
        .equals(category)
        .and(material => material.isActive)
        .toArray();

      return {
        data: materials,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch materials by category"
      };
    }
  }
}

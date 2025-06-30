import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";

export class RawMaterialsAPI {
  // Create a new raw material
  static async create(data) {
    try {
      const materialData = {
        name: data.name,
        description: data.description,
        category: data.category,
        unit: data.unit,
        unit_cost: new Decimal(data.unitCost),
        supplier: data.supplier,
        min_stock_level: new Decimal(data.minStockLevel),
        max_stock_level: new Decimal(data.maxStockLevel),
        is_active: true,
        units_per_pack: data.unitsPerPack,
        base_unit: data.baseUnit
      };

      const material = await prisma().rawMaterial.create({
        data: materialData
      });

      // Convert back to frontend format
      const response = this.formatMaterialForFrontend(material);

      return {
        data: response,
        success: true,
        message: "Raw material created successfully"
      };
    } catch (error) {
      logger.error("Error creating raw material:", error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to create raw material"
      };
    }
  }

  // Get all raw materials with optional filtering
  static async getAll(filters = {}) {
    try {
      const where = {};

      if (filters.isActive !== undefined) {
        where.is_active = filters.isActive;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.search) {
        const searchTerm = filters.search;
        where.OR = [{ name: { contains: searchTerm, mode: "insensitive" } }, { description: { contains: searchTerm, mode: "insensitive" } }, { supplier: { contains: searchTerm, mode: "insensitive" } }];
      }

      const materials = await prisma().rawMaterial.findMany({
        where,
        orderBy: { name: "asc" }
      });

      const response = materials.map(material => this.formatMaterialForFrontend(material));

      return {
        data: response,
        success: true
      };
    } catch (error) {
      logger.error("Error fetching raw materials:", error);
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch raw materials"
      };
    }
  }

  // Get raw material by ID
  static async getById(id) {
    try {
      const material = await prisma().rawMaterial.findUnique({
        where: { id }
      });

      if (!material) {
        return {
          data: null,
          success: true
        };
      }

      const response = this.formatMaterialForFrontend(material);

      return {
        data: response,
        success: true
      };
    } catch (error) {
      logger.error("Error fetching raw material by ID:", error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch raw material"
      };
    }
  }

  // Update raw material
  static async update(data) {
    try {
      const { id, ...updateData } = data;

      const materialData = {};

      if (updateData.name !== undefined) materialData.name = updateData.name;
      if (updateData.description !== undefined) materialData.description = updateData.description;
      if (updateData.category !== undefined) materialData.category = updateData.category;
      if (updateData.unit !== undefined) materialData.unit = updateData.unit;
      if (updateData.unitCost !== undefined) materialData.unit_cost = new Decimal(updateData.unitCost);
      if (updateData.supplier !== undefined) materialData.supplier = updateData.supplier;
      if (updateData.minStockLevel !== undefined) materialData.min_stock_level = new Decimal(updateData.minStockLevel);
      if (updateData.maxStockLevel !== undefined) materialData.max_stock_level = new Decimal(updateData.maxStockLevel);
      if (updateData.isActive !== undefined) materialData.is_active = updateData.isActive;
      if (updateData.unitsPerPack !== undefined) materialData.units_per_pack = updateData.unitsPerPack;
      if (updateData.baseUnit !== undefined) materialData.base_unit = updateData.baseUnit;

      const material = await prisma().rawMaterial.update({
        where: { id },
        data: materialData
      });

      const response = this.formatMaterialForFrontend(material);

      return {
        data: response,
        success: true,
        message: "Raw material updated successfully"
      };
    } catch (error) {
      logger.error("Error updating raw material:", error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to update raw material"
      };
    }
  }

  // Delete raw material (soft delete)
  static async delete(id) {
    try {
      await prisma().rawMaterial.update({
        where: { id },
        data: { is_active: false }
      });

      return {
        data: true,
        success: true,
        message: "Raw material deleted successfully"
      };
    } catch (error) {
      logger.error("Error deleting raw material:", error);
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete raw material"
      };
    }
  }

  // Get low stock materials
  static async getLowStock() {
    try {
      // Get materials with current stock levels
      const materials = await prisma().rawMaterial.findMany({
        where: { is_active: true },
        include: {
          stock_entries: {
            include: {
              stock_movements: {
                where: { type: "OUT" }
              }
            }
          }
        }
      });

      const lowStockMaterials = materials.filter(material => {
        // Calculate current stock level
        const totalReceived = material.stock_entries.reduce((sum, entry) => sum + parseFloat(entry.quantity.toString()), 0);

        const totalUsed = material.stock_entries.reduce((sum, entry) => sum + entry.stock_movements.reduce((movSum, movement) => movSum + parseFloat(movement.quantity.toString()), 0), 0);

        const currentStock = totalReceived - totalUsed;
        const minLevel = parseFloat(material.min_stock_level.toString());

        return currentStock <= minLevel;
      });

      const response = lowStockMaterials.map(material => this.formatMaterialForFrontend(material));

      return {
        data: response,
        success: true
      };
    } catch (error) {
      logger.error("Error fetching low stock materials:", error);
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch low stock materials"
      };
    }
  }

  // Get materials by category
  static async getByCategory(category) {
    try {
      const materials = await prisma().rawMaterial.findMany({
        where: {
          category: category,
          is_active: true
        },
        orderBy: { name: "asc" }
      });

      const response = materials.map(material => this.formatMaterialForFrontend(material));

      return {
        data: response,
        success: true
      };
    } catch (error) {
      logger.error("Error fetching materials by category:", error);
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch materials by category"
      };
    }
  }

  // Helper method to format material data for frontend
  static formatMaterialForFrontend(material) {
    return {
      id: material.id,
      name: material.name,
      description: material.description,
      category: material.category,
      unit: material.unit,
      unitCost: parseFloat(material.unit_cost.toString()),
      supplier: material.supplier,
      minStockLevel: parseFloat(material.min_stock_level.toString()),
      maxStockLevel: parseFloat(material.max_stock_level.toString()),
      isActive: material.is_active,
      unitsPerPack: material.units_per_pack,
      baseUnit: material.base_unit,
      createdAt: material.created_at,
      updatedAt: material.updated_at
    };
  }
}

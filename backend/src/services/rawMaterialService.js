import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";

/**
 * Helper function to format material data for frontend
 */
const formatMaterialForFrontend = material => ({
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
});

/**
 * Get all raw materials with filtering
 */
export const getAllRawMaterials = async (filters = {}) => {
  try {
    logger.info("Fetching raw materials with filters:", filters);

    const where = {};

    if (filters.isActive !== undefined) {
      where.is_active = filters.isActive;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [{ name: { contains: filters.search, mode: "insensitive" } }, { description: { contains: filters.search, mode: "insensitive" } }, { supplier: { contains: filters.search, mode: "insensitive" } }];
    }

    const materials = await prisma().rawMaterial.findMany({
      where,
      orderBy: { name: "asc" }
    });

    return {
      data: materials.map(formatMaterialForFrontend),
      success: true
    };
  } catch (error) {
    logger.error("Error in getAllRawMaterials service:", error);
    throw new Error("Failed to retrieve raw materials");
  }
};

/**
 * Get raw material by ID
 */
export const getRawMaterialById = async id => {
  try {
    if (!id) {
      throw new Error("Raw material ID is required");
    }

    logger.info("Fetching raw material by ID:", id);

    const material = await prisma().rawMaterial.findUnique({
      where: { id }
    });

    if (!material) {
      return {
        data: null,
        success: true
      };
    }

    return {
      data: formatMaterialForFrontend(material),
      success: true
    };
  } catch (error) {
    logger.error("Error in getRawMaterialById service:", error);
    throw new Error("Failed to retrieve raw material");
  }
};

/**
 * Create new raw material
 */
export const createRawMaterial = async materialData => {
  try {
    // Business validation
    if (!materialData.name || !materialData.category || !materialData.unit) {
      throw new Error("Name, category, and unit are required fields");
    }

    if (materialData.unitCost && materialData.unitCost < 0) {
      throw new Error("Unit cost cannot be negative");
    }

    if (materialData.minStockLevel && materialData.maxStockLevel) {
      if (materialData.minStockLevel > materialData.maxStockLevel) {
        throw new Error("Minimum stock level cannot be greater than maximum stock level");
      }
    }

    logger.info("Creating new raw material:", materialData.name);

    // Map frontend data to database format
    const dbData = {
      name: materialData.name,
      description: materialData.description,
      category: materialData.category,
      unit: materialData.unit,
      unit_cost: new Decimal(materialData.unitCost || 0),
      supplier: materialData.supplier,
      min_stock_level: new Decimal(materialData.minStockLevel || 0),
      max_stock_level: new Decimal(materialData.maxStockLevel || 0),
      is_active: true,
      units_per_pack: materialData.unitsPerPack,
      base_unit: materialData.baseUnit
    };

    const material = await prisma().rawMaterial.create({
      data: dbData
    });

    logger.info("Raw material created successfully:", material.id);

    return {
      data: formatMaterialForFrontend(material),
      success: true,
      message: "Raw material created successfully"
    };
  } catch (error) {
    logger.error("Error in createRawMaterial service:", error);
    return {
      data: null,
      success: false,
      message: error.message || "Failed to create raw material"
    };
  }
};

/**
 * Update raw material
 */
export const updateRawMaterial = async updateData => {
  try {
    const { id, ...data } = updateData;

    if (!id) {
      throw new Error("Raw material ID is required");
    }

    // Business validation
    if (data.unitCost && data.unitCost < 0) {
      throw new Error("Unit cost cannot be negative");
    }

    if (data.minStockLevel && data.maxStockLevel) {
      if (data.minStockLevel > data.maxStockLevel) {
        throw new Error("Minimum stock level cannot be greater than maximum stock level");
      }
    }

    logger.info("Updating raw material:", id);

    // Map frontend data to database format
    const dbData = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.description !== undefined) dbData.description = data.description;
    if (data.category !== undefined) dbData.category = data.category;
    if (data.unit !== undefined) dbData.unit = data.unit;
    if (data.unitCost !== undefined) dbData.unit_cost = new Decimal(data.unitCost);
    if (data.supplier !== undefined) dbData.supplier = data.supplier;
    if (data.minStockLevel !== undefined) dbData.min_stock_level = new Decimal(data.minStockLevel);
    if (data.maxStockLevel !== undefined) dbData.max_stock_level = new Decimal(data.maxStockLevel);
    if (data.isActive !== undefined) dbData.is_active = data.isActive;
    if (data.unitsPerPack !== undefined) dbData.units_per_pack = data.unitsPerPack;
    if (data.baseUnit !== undefined) dbData.base_unit = data.baseUnit;

    const material = await prisma().rawMaterial.update({
      where: { id },
      data: dbData
    });

    logger.info("Raw material updated successfully:", id);

    return {
      data: formatMaterialForFrontend(material),
      success: true,
      message: "Raw material updated successfully"
    };
  } catch (error) {
    logger.error("Error in updateRawMaterial service:", error);
    return {
      data: null,
      success: false,
      message: error.message || "Failed to update raw material"
    };
  }
};

/**
 * Delete raw material (soft delete)
 */
export const deleteRawMaterial = async id => {
  try {
    if (!id) {
      throw new Error("Raw material ID is required");
    }

    logger.info("Deleting raw material:", id);

    await prisma().rawMaterial.update({
      where: { id },
      data: { is_active: false }
    });

    logger.info("Raw material deleted successfully:", id);

    return {
      data: true,
      success: true,
      message: "Raw material deleted successfully"
    };
  } catch (error) {
    logger.error("Error in deleteRawMaterial service:", error);
    return {
      data: false,
      success: false,
      message: error.message || "Failed to delete raw material"
    };
  }
};

/**
 * Get low stock materials
 */
export const getLowStockMaterials = async () => {
  try {
    logger.info("Fetching low stock materials");

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

    // Sort by urgency (lowest stock percentage first)
    lowStockMaterials.sort((a, b) => {
      const aTotal = a.stock_entries.reduce((sum, entry) => sum + parseFloat(entry.quantity.toString()), 0);
      const aUsed = a.stock_entries.reduce((sum, entry) => sum + entry.stock_movements.reduce((movSum, movement) => movSum + parseFloat(movement.quantity.toString()), 0), 0);
      const aPercentage = (aTotal - aUsed) / parseFloat(a.min_stock_level.toString());

      const bTotal = b.stock_entries.reduce((sum, entry) => sum + parseFloat(entry.quantity.toString()), 0);
      const bUsed = b.stock_entries.reduce((sum, entry) => sum + entry.stock_movements.reduce((movSum, movement) => movSum + parseFloat(movement.quantity.toString()), 0), 0);
      const bPercentage = (bTotal - bUsed) / parseFloat(b.min_stock_level.toString());

      return aPercentage - bPercentage;
    });

    return {
      data: lowStockMaterials.map(formatMaterialForFrontend),
      success: true
    };
  } catch (error) {
    logger.error("Error in getLowStockMaterials service:", error);
    throw new Error("Failed to retrieve low stock materials");
  }
};

/**
 * Get materials by category
 */
export const getMaterialsByCategory = async category => {
  try {
    if (!category) {
      throw new Error("Category is required");
    }

    logger.info("Fetching materials by category:", category);

    const materials = await prisma().rawMaterial.findMany({
      where: {
        category: category,
        is_active: true
      },
      orderBy: { name: "asc" }
    });

    return {
      data: materials.map(formatMaterialForFrontend),
      success: true
    };
  } catch (error) {
    logger.error("Error in getMaterialsByCategory service:", error);
    throw new Error("Failed to retrieve materials by category");
  }
};

/**
 * Validate material availability for operations
 */
export const validateMaterialAvailability = async (materialId, requiredQuantity) => {
  try {
    const material = await prisma().rawMaterial.findUnique({
      where: { id: materialId }
    });
    if (!material) {
      throw new Error("Material not found");
    }

    if (!material.is_active) {
      throw new Error("Material is not active");
    }

    // Could add more business logic here, like checking stock levels
    return {
      success: true,
      data: formatMaterialForFrontend(material),
      available: true
    };
  } catch (error) {
    logger.error("Error in validateMaterialAvailability service:", error);
    return {
      success: false,
      available: false,
      message: error.message
    };
  }
};

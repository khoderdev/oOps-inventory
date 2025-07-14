import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";

/**
 * Create a new category
 */
export const createCategory = async categoryData => {
  try {
    const newCategory = await prisma().Category.create({
      data: {
        ...categoryData,
        created_by: categoryData.created_by
      }
    });

    logger.info(`Created category: ${newCategory.name}`);

    return {
      success: true,
      data: newCategory,
      message: "Category created successfully"
    };
  } catch (error) {
    logger.error(`Error creating category: ${error.message}`);
    return {
      success: false,
      message: "Failed to create category"
    };
  }
};

/**
 * Get all categories with optional filtering
 */
export const getCategories = async filters => {
  try {
    const categories = await prisma().Category.findMany({});

    logger.info(`Found ${categories.length} categories`);

    return {
      success: true,
      data: categories,
      message: "Categories retrieved successfully"
    };
  } catch (error) {
    logger.error(`Error fetching categories: ${error.message}`);
    return {
      success: false,
      message: "Failed to fetch categories"
    };
  }
};

export const getCategoryById = async categoryId => {
  try {
    const category = await prisma().Category.findUnique({
      where: {
        id: categoryId
      }
    });

    if (!category) {
      return {
        success: false,
        message: "Category not found"
      };
    }

    logger.info(`Found category: ${category.name}`);

    return {
      success: true,
      data: category,
      message: "Category retrieved successfully"
    };
  } catch (error) {
    logger.error(`Error fetching category: ${error.message}`);
    return {
      success: false,
      message: "Failed to fetch category"
    };
  }
};

export const updateCategory = async (categoryId, categoryData) => {
  try {
    const updatedCategory = await prisma().Category.update({
      where: {
        id: categoryId
      },
      data: {
        ...categoryData,
        updated_by: categoryData.updated_by
      }
    });

    logger.info(`Updated category: ${updatedCategory.name}`);

    return {
      success: true,
      data: updatedCategory,
      message: "Category updated successfully"
    };
  } catch (error) {
    logger.error(`Error updating category: ${error.message}`);
    return {
      success: false,
      message: "Failed to update category"
    };
  }
};

export const deleteCategory = async categoryId => {
  try {
    const deletedCategory = await prisma().Category.delete({
      where: {
        id: categoryId
      }
    });

    logger.info(`Deleted category: ${deletedCategory.name}`);

    return {
      success: true,
      data: deletedCategory,
      message: "Category deleted successfully"
    };
  } catch (error) {
    logger.error(`Error deleting category: ${error.message}`);
    return {
      success: false,
      message: "Failed to delete category"
    };
  }
};

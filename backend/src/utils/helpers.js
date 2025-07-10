/**
 * Helper function to format section data for frontend
 */
export const formatSectionForFrontend = section => ({
  id: section.id,
  name: section.name,
  description: section.description,
  type: section.type,
  managerId: section.manager_id,
  isActive: section.is_active,
  createdAt: section.created_at,
  updatedAt: section.updated_at,
  manager: section.manager ? formatUserForFrontend(section.manager) : null
});

/**
 * Helper function to format section inventory data for frontend
 */
export const formatSectionInventoryForFrontend = inventory => ({
  id: inventory.id,
  sectionId: inventory.section_id,
  rawMaterialId: inventory.raw_material_id,
  quantity: parseFloat(inventory.quantity.toString()),
  reservedQuantity: parseFloat(inventory.reserved_quantity.toString()),
  minLevel: inventory.min_level ? parseFloat(inventory.min_level.toString()) : null,
  maxLevel: inventory.max_level ? parseFloat(inventory.max_level.toString()) : null,
  lastUpdated: inventory.last_updated,
  createdAt: inventory.created_at,
  updatedAt: inventory.updated_at,
  section: inventory.section ? formatSectionForFrontend(inventory.section) : null,
  rawMaterial: inventory.raw_material ? formatRawMaterialForFrontend(inventory.raw_material) : null
});

/**
 * Helper function to format section consumption data for frontend
 */
export const formatSectionConsumptionForFrontend = consumption => ({
  id: consumption.id,
  sectionId: consumption.section_id,
  rawMaterialId: consumption.raw_material_id,
  quantity: parseFloat(consumption.quantity.toString()),
  consumedDate: consumption.consumed_date,
  consumedBy: consumption.user ? formatUserForFrontend(consumption.user) : null,
  reason: consumption.reason,
  orderId: consumption.order_id,
  notes: consumption.notes,
  createdAt: consumption.created_at,
  updatedAt: consumption.updated_at,
  section: consumption.section ? formatSectionForFrontend(consumption.section) : null,
  rawMaterial: consumption.raw_material ? formatRawMaterialForFrontend(consumption.raw_material) : null,
  user: consumption.user ? formatUserForFrontend(consumption.user) : null
});

/**
 * Helper function to format raw material data for frontend
 */
export const formatRawMaterialForFrontend = material => ({
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
 * Helper function to format user data for frontend
 */
export const formatUserForFrontend = user => ({
  id: user.id,
  username: user.username,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  displayName: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.username,
  role: user.role,
  isActive: user.is_active
});

/**
 * Helper function to format recipe for frontend
 */
export const formatRecipeForFrontend = recipe => ({
  id: recipe.id,
  name: recipe.name,
  category: recipe.category,
  ingredients: recipe.ingredients,
  instructions: recipe.instructions,
  isActive: recipe.is_active,
  createdAt: recipe.created_at,
  updatedAt: recipe.updated_at,
  servingCost: recipe.serving_cost
});

// Helper function to format section recipe assignment for frontend
export const formatSectionRecipeAssignmentForFrontend = assignment => ({
  id: assignment.id,
  sectionId: assignment.section_id,
  recipeId: assignment.recipe_id,
  assignedBy: assignment.assigned_by_user ? formatUserForFrontend(assignment.assigned_by_user) : null,
  assignedAt: assignment.assigned_at,
  notes: assignment.notes,
  recipe: assignment.recipe ? formatRecipeForFrontend(assignment.recipe) : null
});

/**
 * Helper function to get pack information from raw material
 */
export const getPackInfo = rawMaterial => {
  const isPackOrBox = rawMaterial.unit === "PACKS" || rawMaterial.unit === "BOXES";
  if (!isPackOrBox) return null;

  return {
    unitsPerPack: rawMaterial.units_per_pack || 1,
    baseUnit: rawMaterial.base_unit || "PIECES",
    packUnit: rawMaterial.unit
  };
};

/**
 * Helper function to convert pack quantity to base units
 */
export const convertPackToBase = (quantity, rawMaterial) => {
  const packInfo = getPackInfo(rawMaterial);
  if (!packInfo) return quantity;
  return quantity * packInfo.unitsPerPack;
};

/**
 * Helper function to convert base units to pack quantity
 */
export const convertBaseToPack = (baseQuantity, rawMaterial) => {
  const packInfo = getPackInfo(rawMaterial);
  if (!packInfo) return baseQuantity;
  return parseFloat((baseQuantity / packInfo.unitsPerPack).toFixed(1));
};

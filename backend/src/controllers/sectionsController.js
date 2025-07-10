import { asyncHandler } from "../middleware/errorHandler.js";
import * as sectionsService from "../services/index.js";

/**
 * Create a new section
 * POST /api/sections
 */
export const createSection = asyncHandler(async (req, res) => {
  const result = await sectionsService.createSection(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.status(201).json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Get all sections with optional filtering
 * GET /api/sections
 */
export const getSections = asyncHandler(async (req, res) => {
  const { type, isActive, managerId } = req.query;

  const filters = {};
  if (type) filters.type = type;
  if (isActive !== undefined) filters.isActive = isActive === "true";
  if (managerId) filters.managerId = managerId;

  const result = await sectionsService.getAllSections(filters);

  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Get section by ID
 * GET /api/sections/:id
 */
export const getSection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await sectionsService.getSectionById(parseInt(id, 10));

  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: "Section not found"
    });
  }

  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Update section
 * PUT /api/sections/:id
 */
export const updateSection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await sectionsService.updateSection({ id: parseInt(id, 10), ...req.body });

  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Delete section
 * DELETE /api/sections/:id
 */
export const deleteSection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await sectionsService.deleteSection(parseInt(id, 10));

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Assign stock to section
 * POST /api/sections/:id/assign-stock
 */
export const assignStockToSection = asyncHandler(async (req, res) => {
  const { id: sectionId } = req.params;
  const { rawMaterialId, quantity, assignedBy, notes } = req.body;

  const result = await sectionsService.assignStockToSection({
    sectionId: parseInt(sectionId, 10),
    rawMaterialId,
    quantity,
    assignedBy,
    notes
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Assign recipe to section
 * POST /api/sections/:id/assign-recipe
 */
export const assignRecipeToSection = asyncHandler(async (req, res) => {
  const { id: sectionId } = req.params;
  const { recipeId, assignedBy, notes } = req.body;

  const result = await sectionsService.assignRecipeToSection({
    sectionId: parseInt(sectionId, 10),
    recipeId,
    assignedBy,
    notes
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.status(201).json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Get section recipe assignments
 * GET /api/sections/:id/recipes
 */
export const getSectionRecipes = asyncHandler(async (req, res) => {
  const { id: sectionId } = req.params;
  const result = await sectionsService.getSectionRecipeAssignments(parseInt(sectionId, 10));
  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Remove recipe assignment from section
 * DELETE /api/sections/recipes/:assignmentId
 */
export const removeSectionRecipe = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { removedBy, notes } = req.body;

  const result = await sectionsService.removeRecipeAssignment(parseInt(assignmentId, 10), removedBy, notes);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Get section inventory
 * GET /api/sections/:id/inventory
 */
export const getSectionInventory = asyncHandler(async (req, res) => {
  const { id: sectionId } = req.params;
  const result = await sectionsService.getSectionInventory(parseInt(sectionId, 10));
  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Record consumption in section
 * POST /api/sections/:id/consume
 */
export const recordConsumption = asyncHandler(async (req, res) => {
  const { id: sectionId } = req.params;
  const { rawMaterialId, quantity, consumedBy, reason, orderId, notes } = req.body;

  const result = await sectionsService.recordSectionConsumption({
    sectionId: parseInt(sectionId, 10),
    rawMaterialId,
    quantity,
    consumedBy,
    reason,
    orderId,
    notes
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.status(201).json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Get section consumption history
 * GET /api/sections/:id/consumption
 */
export const getSectionConsumption = asyncHandler(async (req, res) => {
  const { id: sectionId } = req.params;
  const { rawMaterialId, fromDate, toDate } = req.query;

  const filters = {};
  if (rawMaterialId) filters.rawMaterialId = rawMaterialId;
  if (fromDate) filters.fromDate = fromDate;
  if (toDate) filters.toDate = toDate;

  const result = await sectionsService.getSectionConsumption(parseInt(sectionId, 10), filters);

  res.json({
    success: true,
    data: result.data
  });
});

/**
 * Update section inventory assignment
 * PUT /api/sections/inventory/:inventoryId
 */
export const updateSectionInventory = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;
  const { quantity, updatedBy, notes } = req.body;

  const result = await sectionsService.updateSectionInventory(parseInt(inventoryId, 10), quantity, updatedBy, notes);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    data: result.data,
    message: result.message
  });
});

/**
 * Remove section inventory assignment
 * DELETE /api/sections/inventory/:inventoryId
 */
export const removeSectionInventory = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;
  const { removedBy, notes } = req.body;

  const result = await sectionsService.removeSectionInventory(parseInt(inventoryId, 10), removedBy, notes);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  res.json({
    success: true,
    message: result.message
  });
});

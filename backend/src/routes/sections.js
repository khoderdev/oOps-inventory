import { Router } from "express";
import { assignRecipeToSection, assignStockToSection, createSection, deleteSection, getSection, getSectionConsumption, getSectionInventory, getSectionRecipes, getSections, recordConsumption, removeSectionInventory, removeSectionRecipe, updateSection, updateSectionInventory } from "../controllers/sectionsController.js";
import { authenticate } from "../middleware/auth.js";
import { requireManager } from "../middleware/rbac.js";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Sections Routes

// GET /api/sections - Get all sections with optional filtering
router.get("/", getSections);

// GET /api/sections/:id - Get section by ID
router.get("/:id", getSection);

// POST /api/sections - Create new section (Manager only)
router.post("/", requireManager, createSection);

// PUT /api/sections/:id - Update section (Manager only)
router.put("/:id", requireManager, updateSection);

// DELETE /api/sections/:id - Delete section (Manager only)
router.delete("/:id", requireManager, deleteSection);

// Section Inventory Routes

// GET /api/sections/:id/inventory - Get section inventory
router.get("/:id/inventory", getSectionInventory);

// POST /api/sections/:id/assign-stock - Assign stock to section (Manager only)
router.post("/:id/assign-stock", requireManager, assignStockToSection);

// POST /api/sections/:id/assign-recipe - Assign recipe to section (Manager only)
router.post("/:id/assign-recipe", requireManager, assignRecipeToSection);

// GET /api/sections/:id/recipes - Get section recipe assignments
router.get("/:id/recipes", getSectionRecipes);

// POST /api/sections/:assignmentId/remove-recipe - Remove recipe assignment from section (Manager only)
router.post("/:assignmentId/remove-recipe", removeSectionRecipe);

// PUT /api/sections/inventory/:inventoryId - Update section inventory assignment (Manager only)
router.put("/inventory/:inventoryId", requireManager, updateSectionInventory);

// DELETE /api/sections/inventory/:inventoryId - Remove section inventory assignment (Manager only)
router.delete("/inventory/:inventoryId", requireManager, removeSectionInventory);

// Section Consumption Routes

// GET /api/sections/:id/consumption - Get section consumption history
router.get("/:id/consumption", getSectionConsumption);

// POST /api/sections/:id/consume - Record consumption in section
router.post("/:id/consume", recordConsumption);

export default router;

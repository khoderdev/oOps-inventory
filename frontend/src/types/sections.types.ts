import type { BaseEntity, User } from "./common.types";
import type { RawMaterial } from "./rawMaterials.types";
import type { Recipe } from "./recipes.types";

export interface Section extends BaseEntity {
  name: string;
  description?: string | null;
  type: SectionType;
  isActive: boolean;
  managerId: number;
  manager?: User;
}

export enum SectionType {
  KITCHEN = "KITCHEN",
  BAR = "BAR",
  STORAGE = "STORAGE",
  PREPARATION = "PREPARATION",
  OTHER = "OTHER"
}

export interface SectionInventory extends BaseEntity {
  packQuantity: number;
  sectionId: number;
  section?: Section;
  rawMaterialId: number;
  rawMaterial?: RawMaterial;
  quantity: number;
  reservedQuantity: number;
  minLevel?: number | null;
  maxLevel?: number | null;
  lastUpdated: Date;
}

export interface SectionRecipe extends BaseEntity {
  sectionId: number;
  section?: Section;
  recipeId: number;
  recipe?: Recipe;
  serving_cost: number;
}

export interface SectionConsumption extends BaseEntity {
  sectionId: number;
  section?: Section;
  rawMaterialId: number;
  rawMaterial?: RawMaterial;
  quantity: number;
  consumedDate: Date;
  consumedBy: number;
  user?: User;
  reason: string;
  orderId?: string | null;
  notes?: string | null;
}

export interface SectionAssignment {
  sectionId: number;
  rawMaterialId: number;
  quantity: number;
  assignedBy: number;
  assignedDate: Date;
  notes?: string | null;
}

// INPUT TYPES
export interface CreateSectionInput {
  name: string;
  description?: string | null;
  type: SectionType;
  managerId: number;
  isActive?: boolean;
}

export interface UpdateSectionInput extends Partial<CreateSectionInput> {
  id: number;
}

export interface CreateSectionAssignmentInput {
  sectionId: number;
  rawMaterialId: number;
  quantity: number;
  assignedBy: number;
  notes?: string | null;
}

export interface CreateSectionRecipeAssignmentInput {
  sectionId: number;
  recipeId: number;
  assignedBy: number;
  notes?: string | null;
}

export interface RemoveSectionRecipeAssignmentInput {
  assignmentId: number;
  removedBy: number | string;
  notes?: string | null;
}

export interface SectionRecipeAssignment {
  id: number;
  sectionId: number;
  recipeId: number;
  serving_cost: number;
}

// COMPONENT PROPS
export interface SectionDetailsModalProps {
  section: Section | null;
  isOpen: boolean;
  onClose: () => void;
}

// FILTER TYPES
export interface SectionFilters {
  type?: SectionType;
  isActive?: boolean;
  managerId?: number;
}

// REQUEST TYPES
export interface ConsumptionRequest {
  sectionId: number;
  rawMaterialId: number;
  quantity: number;
  consumedBy: number;
  reason: string;
  orderId?: string | null;
  notes?: string | null;
}

export interface InventoryUpdateRequest {
  inventoryId: number;
  quantity: number;
  updatedBy: string;
  notes?: string | null;
}

// Add to your existing types
export interface RecipeConsumption extends BaseEntity {
  recipeId: number;
  recipe?: Recipe;
  sectionId: number;
  section?: Section;
  consumedBy: number;
  user?: User;
  consumedDate: Date;
  orderId?: string | null;
  notes?: string | null;
  ingredients: {
    rawMaterialId: number;
    rawMaterial?: RawMaterial;
    quantity: number;
  }[];
}

// Add to your input types
export interface RecordRecipeConsumptionInput {
  recipeId: number;
  sectionId: number;
  consumedBy: number;
  orderId?: string | null;
  notes?: string | null;
}

// Add to your filter types
export interface RecipeConsumptionFilters {
  sectionId?: string;
  fromDate?: Date;
  toDate?: Date;
}

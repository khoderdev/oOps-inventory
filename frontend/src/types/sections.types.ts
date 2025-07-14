// import type { BaseEntity, User } from "./common.types";
// import type { MeasurementUnit, RawMaterial } from "./rawMaterials.types";
// import type { Recipe, RecipeIngredient } from "./recipes.types";

// export interface Section extends BaseEntity {
//   name: string;
//   description?: string | null;
//   type: SectionType;
//   isActive: boolean;
//   managerId: number;
//   manager?: User;
// }

// export enum SectionType {
//   KITCHEN = "KITCHEN",
//   BAR = "BAR",
//   STORAGE = "STORAGE",
//   PREPARATION = "PREPARATION",
//   OTHER = "OTHER"
// }

// export interface SectionInventory extends BaseEntity {
//   packQuantity: number;
//   sectionId: number;
//   section?: Section;
//   rawMaterialId: number;
//   rawMaterial?: RawMaterial;
//   quantity: number;
//   reservedQuantity: number;
//   minLevel?: number | null;
//   maxLevel?: number | null;
//   lastUpdated: Date;
// }

// export interface SectionRecipe extends BaseEntity {
//   sectionId: number;
//   section?: Section;
//   recipeId: number;
//   recipe?: Recipe;
//   serving_cost: number;
// }

// export interface SectionConsumption extends BaseEntity {
//   ingredients: RecipeIngredient[];
//   recipe: Recipe;
//   sectionId: number;
//   section?: Section;
//   rawMaterialId: number;
//   rawMaterial?: RawMaterial;
//   quantity: number;
//   consumedDate: Date;
//   consumedBy: number;
//   user?: User;
//   reason: string;
//   orderId?: string | null;
//   notes?: string | null;
// }

// export interface SectionAssignment {
//   sectionId: number;
//   rawMaterialId: number;
//   quantity: number;
//   assignedBy: number;
//   assignedDate: Date;
//   notes?: string | null;
// }

// // INPUT TYPES
// export interface CreateSectionInput {
//   name: string;
//   description?: string | null;
//   type: SectionType;
//   managerId: number;
//   isActive?: boolean;
// }

// export interface UpdateSectionInput extends Partial<CreateSectionInput> {
//   id: number;
// }

// export interface CreateSectionAssignmentInput {
//   sectionId: number;
//   rawMaterialId: number;
//   quantity: number;
//   assignedBy: number;
//   notes?: string | null;
// }

// export interface CreateSectionRecipeAssignmentInput {
//   sectionId: number;
//   recipeId: number;
//   assignedBy: number;
//   notes?: string | null;
// }

// export interface RemoveSectionRecipeAssignmentInput {
//   assignmentId: number;
//   removedBy: number | string;
//   notes?: string | null;
// }

// export interface SectionRecipeAssignment {
//   id: number;
//   sectionId: number;
//   recipeId: number;
//   serving_cost: number;
// }

// // COMPONENT PROPS
// export interface SectionDetailsModalProps {
//   section: Section | null;
//   isOpen: boolean;
//   onClose: () => void;
// }

// // FILTER TYPES
// export interface SectionFilters {
//   type?: SectionType;
//   isActive?: boolean;
//   managerId?: number;
// }

// // REQUEST TYPES
// export interface ConsumptionRequest {
//   sectionId: number;
//   rawMaterialId: number;
//   quantity: number;
//   consumedBy: number;
//   reason: string;
//   orderId?: string | null;
//   notes?: string | null;
// }

// export interface InventoryUpdateRequest {
//   inventoryId: number;
//   quantity: number;
//   updatedBy: string;
//   notes?: string | null;
// }

// export interface SectionConsumptionFilters {
//   sectionId?: string;
//   fromDate?: Date;
//   toDate?: Date;
// }

// export interface RecipeConsumption extends BaseEntity {
//   recipeId: number;
//   recipe?: Recipe;
//   sectionId: number;
//   section?: Section;
//   consumedBy: number;
//   user?: User;
//   consumedDate: Date;
//   orderId?: string | null;
//   notes?: string | null;
//   reason?: string;
//   ingredients: {
//     rawMaterialId: number;
//     rawMaterial?: RawMaterial;
//     quantity: number;
//     unit: MeasurementUnit;
//     baseUnit: MeasurementUnit;
//     costPerUnit?: number;
//   }[];
// }

// export interface RecipeConsumptionIngredient {
//   id: number;
//   recipeConsumptionId: number;
//   rawMaterialId: number;
//   quantity: number;
//   unit: MeasurementUnit;
//   baseUnit: MeasurementUnit;
//   costPerUnit?: number;
// }

// export interface RecordRecipeConsumptionInput {
//   recipeId: number;
//   sectionId: number;
//   consumedBy: number;
//   orderId?: string;
//   notes?: string;
//   reason?: string;
// }

// export interface RecipeConsumptionFilters {
//   sectionId?: string;
//   fromDate?: Date;
//   toDate?: Date;
// }

// export interface RecipeConsumptionApiResponse {
//   data: RecipeConsumption[];
// }

import type { BaseEntity, User } from "./common.types";
import type { MeasurementUnit, RawMaterial } from "./rawMaterials.types";
import type { Recipe } from "./recipes.types";

export interface Section extends BaseEntity {
  name: string;
  description?: string | null;
  type: SectionType;
  isActive: boolean;
  managerId: number;
  manager?: User;
  currentInventoryValue?: number;
  lastStockTake?: Date | null;
}

export enum SectionType {
  KITCHEN = "KITCHEN",
  BAR = "BAR",
  STORAGE = "STORAGE",
  PREPARATION = "PREPARATION",
  RETAIL = "RETAIL",
  OTHER = "OTHER"
}

export interface SectionInventory extends BaseEntity {
  sectionId: number;
  section?: Section;
  rawMaterialId: number;
  rawMaterial?: RawMaterial;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minLevel?: number | null;
  maxLevel?: number | null;
  lastUpdated: Date;
  unitCost: number;
  totalValue: number;
  expiryDate?: Date | null;
  batchNumber?: string | null;
}

export interface SectionRecipe extends BaseEntity {
  sectionId: number;
  section?: Section;
  recipeId: number;
  recipe?: Recipe;
  servingCost: number;
  currentServingsAvailable: number;
  isActive: boolean;
  lastPrepared?: Date | null;
}

export interface SectionConsumption extends BaseEntity {
  sectionId: number;
  section?: Section;
  rawMaterialId: number;
  rawMaterial?: RawMaterial;
  quantity: number;
  unitCost: number;
  totalCost: number;
  consumedDate: Date;
  consumedBy: number;
  user?: User;
  reason: string;
  orderId?: string | null;
  notes?: string | null;
  source?: "POS" | "MANUAL" | "WASTE" | "OTHER";
}

export interface SectionAssignment extends BaseEntity {
  sectionId: number;
  rawMaterialId: number;
  quantity: number;
  assignedBy: number;
  user?: User;
  assignedDate: Date;
  notes?: string | null;
  expiryDate?: Date | null;
  batchNumber?: string | null;
}

export interface CartItem {
  id: string;
  type: "item" | "recipe";
  name: string;
  price: number;
  quantity: number;
  sectionId: number;
}

export interface POSSale {
  id: string;
  sectionId: number;
  section?: Section;
  cashierId: number;
  cashier?: User;
  items: Array<{
    id: string;
    type: "item" | "recipe";
    name: string;
    price: number;
    quantity: number;
    cost: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "CASH" | "CARD" | "MIXED";
  paymentDetails?: {
    cashReceived?: number;
    changeGiven?: number;
    cardLast4?: string;
    cardType?: string;
  };
  customerNote?: string;
  saleDate: Date;
  status: "COMPLETED" | "REFUNDED" | "VOIDED";
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
  expiryDate?: Date | null;
  batchNumber?: string | null;
}

export interface CreateSectionRecipeAssignmentInput {
  sectionId: number;
  recipeId: number;
  assignedBy: number;
  notes?: string | null;
  initialServings?: number;
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
  servingCost: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessPOSPaymentInput {
  sectionId: number;
  cashierId: number;
  items: Array<{
    id: string;
    type: "item" | "recipe";
    quantity: number;
  }>;
  paymentMethod: "CASH" | "CARD";
  paymentDetails?: {
    cashReceived?: number;
    cardLast4?: string;
  };
  customerNote?: string;
}

// FILTER TYPES
export interface SectionFilters {
  type?: SectionType;
  isActive?: boolean;
  managerId?: number;
  search?: string;
}

export interface POSItemFilters {
  sectionId?: number;
  search?: string;
  category?: string;
  inStockOnly?: boolean;
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
  source?: "POS" | "MANUAL" | "WASTE" | "OTHER";
}

export interface InventoryUpdateRequest {
  inventoryId: number;
  quantity: number;
  updatedBy: string;
  notes?: string | null;
}

export interface SectionConsumptionFilters {
  sectionId?: number;
  fromDate?: Date;
  toDate?: Date;
  source?: "POS" | "MANUAL" | "WASTE" | "OTHER";
  rawMaterialId?: number;
}

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
  reason?: string;
  source?: "POS" | "MANUAL" | "WASTE" | "OTHER";
  ingredients: Array<{
    rawMaterialId: number;
    rawMaterial?: RawMaterial;
    quantity: number;
    unit: MeasurementUnit;
    baseUnit: MeasurementUnit;
    costPerUnit?: number;
    totalCost?: number;
  }>;
  totalCost: number;
}

export interface RecipeConsumptionIngredient {
  id: number;
  recipeConsumptionId: number;
  rawMaterialId: number;
  quantity: number;
  unit: MeasurementUnit;
  baseUnit: MeasurementUnit;
  costPerUnit?: number;
  totalCost?: number;
}

export interface RecordRecipeConsumptionInput {
  recipeId: number;
  sectionId: number;
  quantity: number;
  consumedBy: number;
  orderId?: string;
  notes?: string;
  reason?: string;
  source?: "POS" | "MANUAL" | "WASTE" | "OTHER";
}

export interface RecipeConsumptionFilters {
  sectionId?: number;
  fromDate?: Date;
  toDate?: Date;
  recipeId?: number;
  source?: "POS" | "MANUAL" | "WASTE" | "OTHER";
}

export interface POSReportFilters {
  sectionId?: number;
  fromDate: Date;
  toDate: Date;
  cashierId?: number;
  paymentMethod?: "CASH" | "CARD";
}

export interface POSSaleSummary {
  totalSales: number;
  totalTax: number;
  totalTransactions: number;
  averageSale: number;
  paymentMethodBreakdown: {
    cash: number;
    card: number;
  };
  topItems: Array<{
    id: string;
    name: string;
    type: "item" | "recipe";
    quantity: number;
    total: number;
  }>;
}

export interface RecipeConsumptionApiResponse {
  data: RecipeConsumption[];
  total: number;
  filteredTotal: number;
}

export interface POSApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: Date;
}

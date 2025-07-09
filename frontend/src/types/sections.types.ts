import type { BaseEntity, User } from "./common.types";
import type { RawMaterial } from "./rawMaterials.types";

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

export interface SectionConsumptionFilters {
  rawMaterialId?: number;
  fromDate?: Date;
  toDate?: Date;
  sectionId?: number;
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

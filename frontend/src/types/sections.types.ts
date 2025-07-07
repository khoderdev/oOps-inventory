import type { BaseEntity, User } from "./common.types";
import type { RawMaterial } from "./rawMaterials.types";

export interface Section extends BaseEntity {
  name: string;
  description?: string;
  type: SectionType;
  managerId: string;
  manager?: User;
  isActive: boolean;
}

export enum SectionType {
  KITCHEN = "kitchen",
  BAR = "bar",
  STORAGE = "storage",
  PREPARATION = "preparation",
  OTHER = "other"
}

export interface SectionInventory extends BaseEntity {
  sectionId: string;
  section?: Section;
  rawMaterialId: string;
  rawMaterial?: RawMaterial;
  quantity: number;
  baseQuantity?: number; // For pack/box materials, this is the quantity in base units (pieces)
  reservedQuantity: number;
  lastUpdated: Date;
  minLevel?: number;
  maxLevel?: number;
}

export interface SectionConsumption extends BaseEntity {
  sectionId: string;
  section?: Section;
  rawMaterialId: string;
  rawMaterial?: RawMaterial;
  quantity: number;
  consumedDate: Date;
  consumedBy: string;
  reason: string;
  orderId?: string;
  notes?: string;
}

export interface SectionAssignment {
  sectionId: string;
  rawMaterialId: string;
  quantity: number;
  assignedBy: string;
  assignedDate: Date;
  notes?: string;
}

export interface CreateSectionInput {
  name: string;
  description?: string;
  type: SectionType;
  managerId: string;
}

export interface UpdateSectionInput extends Partial<CreateSectionInput> {
  id: string;
  isActive?: boolean;
}

export interface CreateSectionAssignmentInput {
  sectionId: string;
  rawMaterialId: string;
  quantity: number;
  assignedBy: string;
  notes?: string;
}

export interface SectionDetailsModalProps {
  section: Section | null;
  isOpen: boolean;
  onClose: () => void;
}

// Sections API filters interfaces
export interface SectionFilters {
  type?: string;
  isActive?: boolean;
  managerId?: string;
}

export interface SectionConsumptionFilters {
  rawMaterialId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ConsumptionRequest {
  sectionId: string;
  rawMaterialId: string;
  quantity: number;
  consumedBy: string;
  reason: string;
  orderId?: string;
  notes?: string;
}

export interface InventoryUpdateRequest {
  inventoryId: string;
  quantity: number;
  updatedBy: string;
  notes?: string;
}

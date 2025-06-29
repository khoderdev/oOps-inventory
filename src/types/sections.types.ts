import type { BaseEntity } from "./common.types";
import type { RawMaterial } from "./rawMaterials.types";

export interface Section extends BaseEntity {
  name: string;
  description?: string;
  type: SectionType;
  managerId: string;
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
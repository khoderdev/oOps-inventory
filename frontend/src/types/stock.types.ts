import type { BaseEntity } from "./common.types";
import type { RawMaterial } from "./rawMaterials.types";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  isActive: boolean;
}

export interface StockEntry extends BaseEntity {
  rawMaterialId: string;
  rawMaterial?: RawMaterial;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: Date;
  receivedDate: Date;
  receivedBy: string;
  user?: User;
  notes?: string;
}

export interface StockMovement extends BaseEntity {
  stockEntryId: string;
  stockEntry?: StockEntry;
  type: MovementType;
  quantity: number;
  fromSectionId?: string;
  toSectionId?: string;
  reason: string;
  performedBy: string;
  user?: User;
  referenceId?: string; // For linking to orders, sections, etc.
}

export enum MovementType {
  IN = "in", // Stock received
  OUT = "out", // Stock used/consumed
  TRANSFER = "transfer", // Between sections
  ADJUSTMENT = "adjustment", // Manual correction
  EXPIRED = "expired", // Expired stock removal
  DAMAGED = "damaged" // Damaged stock removal
}

export interface StockLevel {
  rawMaterial: RawMaterial;
  totalUnitsQuantity: number;
  availableUnitsQuantity: number;
  totalSubUnitsQuantity: number;
  availableSubUnitsQuantity: number;
  reservedQuantity: number;
  minLevel: number;
  maxLevel: number;
  isLowStock: boolean;
  lastUpdated: Date;
}

export interface CreateStockEntryInput {
  rawMaterialId: string;
  quantity: number;
  unitCost: number;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: Date;
  receivedDate: Date;
  receivedBy: string;
  notes?: string;
}

export interface UpdateStockEntryInput extends Partial<CreateStockEntryInput> {
  id: string;
}

export interface CreateStockMovementInput {
  stockEntryId: string;
  type: MovementType;
  quantity: number;
  fromSectionId?: string;
  toSectionId?: string;
  reason: string;
  performedBy: string;
  referenceId?: string;
}

export interface StockEntryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

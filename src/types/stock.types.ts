import type { BaseEntity } from "./common.types";
import type { RawMaterial } from "./rawMaterials.types";

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
  rawMaterialId: string;
  rawMaterial?: RawMaterial;
  totalQuantity: number;
  availableQuantity: number;
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

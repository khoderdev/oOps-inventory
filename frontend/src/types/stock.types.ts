import type { BaseEntity, User } from "./common.types";
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
  productionDate?: Date;
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
  productionDate?: Date;
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

// Stock API filters interfaces
export interface StockEntryFilters {
  rawMaterialId?: string;
  supplier?: string;
  fromDate?: string;
  toDate?: string;
}

export interface StockMovementFilters {
  stockEntryId?: string;
  type?: MovementType;
  fromDate?: string;
  toDate?: string;
  sectionId?: string;
}

export interface StockTransferRequest {
  fromSectionId: string;
  toSectionId: string;
  items: Array<{
    stockEntryId: string;
    quantity: number;
  }>;
  reason: string;
  performedBy: string;
}

// Report response types
export interface ReportsData {
  metrics: {
    totalInventoryValue: number;
    lowStockCount: number;
    totalPurchaseValue: number;
    totalConsumptionValue: number;
    wasteValue: number;
    totalMovements: number;
    totalEntries: number;
    activeMaterials: number;
    activeSections: number;
  };
  categoryBreakdown: Record<string, number>;
  consumptionByCategory: Record<string, number>;
  expenseBreakdown: {
    purchases: Record<string, number>;
    totalPurchases: number;
    averageOrderValue: number;
    topSuppliers: Array<{
      name: string;
      total: number;
    }>;
  };
  lowStockItems: Array<{
    id: number;
    name: string;
    category: string;
    currentStock: number;
    minLevel: number;
    unit: string;
  }>;
}

export interface ConsumptionReportData {
  totalQuantityConsumed: number;
  totalValueConsumed: number;
  byReason: Record<
    string,
    {
      count: number;
      totalValue: number;
    }
  >;
  byMaterial: Record<
    string,
    {
      material: RawMaterial;
      totalQuantity: number;
      totalValue: number;
      movements: StockMovement[];
    }
  >;
  wasteValue: number;
  wasteCount: number;
  totalMovements: number;
  consumptionByCategory: Record<string, number>;
  topConsumedMaterials: Array<{
    material: RawMaterial;
    totalQuantity: number;
    totalValue: number;
    movements: StockMovement[];
  }>;
  recentActivity: StockMovement[];
}

export interface ExpenseReportData {
  purchases: Record<string, number>;
  totalPurchases: number;
  averageOrderValue: number;
  topSuppliers: Array<{
    name: string;
    total: number;
    orderCount: number;
    avgOrderValue: number;
    uniqueMaterials: number;
    lastOrder: Date | null;
  }>;
  materialCosts: Array<{
    material: RawMaterial;
    totalCost: number;
    totalQuantity: number;
    avgUnitCost: number;
    entryCount: number;
    lastPurchase: Date | null;
  }>;
  periods: Array<{
    period: string;
    total: number;
    count: number;
  }>;
  totalEntries: number;
}

export interface LowStockReportData {
  summary: {
    totalLowStock: number;
    critical: number;
    warning: number;
  };
  items: {
    critical: Array<{
      id: number;
      name: string;
      category: string;
      currentStock: number;
      minLevel: number;
      unit: string;
      unitCost: number;
      value: number;
    }>;
    warning: Array<{
      id: number;
      name: string;
      category: string;
      currentStock: number;
      minLevel: number;
      unit: string;
      unitCost: number;
      value: number;
    }>;
    all: Array<{
      id: number;
      name: string;
      category: string;
      currentStock: number;
      minLevel: number;
      unit: string;
      unitCost: number;
      value: number;
      stockPercentage: number;
    }>;
  };
}

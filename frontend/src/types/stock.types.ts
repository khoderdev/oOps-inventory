import type { BaseEntity, User } from "./common.types";
import type { MeasurementUnit, RawMaterial } from "./rawMaterials.types";
import type { Section } from "./sections.types";

// ENUMS (must exactly match Prisma)
export enum MovementType {
  IN = "IN",
  OUT = "OUT",
  TRANSFER = "TRANSFER",
  ADJUSTMENT = "ADJUSTMENT",
  EXPIRED = "EXPIRED",
  DAMAGED = "DAMAGED"
}

// MAIN ENTITY TYPES
export interface StockEntry extends BaseEntity {
  convertedUnit: string;
  rawMaterial: RawMaterial;
  rawMaterialId: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  displayUnit?: MeasurementUnit | null;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: Date | null;
  productionDate?: Date | null;
  receivedDate: Date;
  notes?: string | null;
  receivedById: number;
  receivedBy?: User;
}

export interface StockMovement extends BaseEntity {
  material: RawMaterial;
  stockEntryId: number;
  stockEntry?: StockEntry;
  type: MovementType;
  quantity: number;
  fromSectionId?: number | null;
  toSectionId?: number | null;
  fromSection?: Section | null;
  toSection?: Section | null;
  reason: string;
  // performedBy: User;
  user?: User;
  referenceId?: string | null;
}

// CREATE/UPDATE INPUTS
export interface CreateStockEntryInput {
  rawMaterialId: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier?: string | null;
  batchNumber?: string | null;
  expiryDate?: Date | null;
  productionDate?: Date | null;
  receivedDate: Date;
  notes?: string | null;
  receivedById: number;
}

export interface UpdateStockEntryInput extends Partial<CreateStockEntryInput> {
  id: number;
}

export interface CreateStockMovementInput {
  stockEntryId: number;
  type: MovementType;
  quantity: number;
  fromSectionId?: number | null;
  toSectionId?: number | null;
  reason: string;
  performedBy: number;
  referenceId?: string | null;
}

// STOCK LEVEL (Derived type)
export interface StockLevel {
  rawMaterial: RawMaterial;
  totalUnitsQuantity: number;
  availableUnitsQuantity: number;
  totalSubUnitsQuantity: number;
  availableSubUnitsQuantity: number;
  reservedQuantity: number;
  convertedUnit: string;
  originalUnit: string;
  minLevel: number;
  maxLevel: number;
  isLowStock: boolean;
  lastUpdated: Date;
}

// FILTER TYPES
export interface StockEntryFilters {
  rawMaterialId?: number;
  supplier?: string;
  fromDate?: Date;
  toDate?: Date;
  batchNumber?: string;
}

export interface StockMovementFilters {
  stockEntryId?: number;
  type?: MovementType;
  fromDate?: Date;
  toDate?: Date;
  sectionId?: number;
  materialId?: number;
}

// OPERATIONAL TYPES
export interface StockTransferRequest {
  fromSectionId: number;
  toSectionId: number;
  items: Array<{
    stockEntryId: number;
    quantity: number;
  }>;
  reason: string;
  performedBy: number;
}

export interface StockEntryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// REPORT TYPES (Derived structures)
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
  byReason: Record<string, { count: number; totalValue: number }>;
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
  periods: Array<{ period: string; total: number; count: number }>;
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

export interface MovementWithDetails {
  material: unknown;
  entry: unknown;
  value: number;
}

export interface ReasonData {
  count: number;
  totalValue: number;
  movements: MovementWithDetails[];
}

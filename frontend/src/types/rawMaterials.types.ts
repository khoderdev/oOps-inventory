import type { BaseEntity } from "./common.types";
import type { SupplierMaterial } from "./suppliers.types";

export interface RawMaterial extends BaseEntity {
  costPerIndividualUnit: number;
  name: string;
  description?: string | null;
  category: CategoryResponse;
  unit: MeasurementUnit;
  displayUnit?: string | null;
  baseUnit?: MeasurementUnit | null;
  unitsPerPack?: number | null;
  unitCost: number;
  costPerBaseUnit?: number;
  unitCostPerBaseUnit?: number;
  supplier?: string | null;
  supplierMaterials?: SupplierMaterial[];
  minStockLevel: number;
  maxStockLevel: number;
  isActive: boolean;
}

export type CategoryResponse = {
  id: number;
  name: string;
  description: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = CategoryResponse["name"];

export enum MeasurementUnit {
  KG = "KG",
  GRAMS = "GRAMS",
  LITERS = "LITERS",
  ML = "ML",
  PIECES = "PIECES",
  PACKS = "PACKS",
  BOXES = "BOXES",
  BOTTLES = "BOTTLES"
}

export interface CreateRawMaterialInput {
  name: string;
  description?: string | null;
  category: Category;
  unit: MeasurementUnit;
  baseUnit?: MeasurementUnit | null;
  unitsPerPack?: number | null;
  unitCost: number;
  supplier?: string | null;
  minStockLevel: number;
  maxStockLevel: number;
}

export interface UpdateRawMaterialInput extends Partial<CreateRawMaterialInput> {
  id: number;
  isActive?: boolean;
}

export interface MaterialConsumption {
  material: unknown;
  totalQuantity: number;
  totalValue: number;
  movements: unknown[];
}

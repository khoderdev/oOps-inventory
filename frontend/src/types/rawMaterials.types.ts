import type { BaseEntity } from "./common.types";
import type { SupplierMaterial } from "./suppliers.types";

export interface RawMaterial extends BaseEntity {
  name: string;
  description?: string | null;
  category: MaterialCategory;
  unit: MeasurementUnit;
  baseUnit?: MeasurementUnit | null; // Optional in Prisma
  unitsPerPack?: number | null; // Optional in Prisma
  unitCost: number; // Prisma uses Decimal
  supplier?: string | null;
  supplierMaterials?: SupplierMaterial[];
  minStockLevel: number; // Was nested stockThreshold.min
  maxStockLevel: number; // Was nested stockThreshold.max
  isActive: boolean;
}

export enum MaterialCategory {
  MEAT = "MEAT",
  VEGETABLES = "VEGETABLES",
  DAIRY = "DAIRY",
  BEVERAGES = "BEVERAGES",
  BREAD = "BREAD",
  GRAINS = "GRAINS",
  SPICES = "SPICES",
  PACKAGING = "PACKAGING",
  OTHER = "OTHER"
}

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
  category: MaterialCategory;
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

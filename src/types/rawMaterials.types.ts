import type { BaseEntity } from "./common.types";

export interface RawMaterial extends BaseEntity {
  name: string;
  description?: string;
  category: MaterialCategory;
  unit: MeasurementUnit;
  unitCost: number;
  supplier?: string;
  minStockLevel: number;
  maxStockLevel: number;
  isActive: boolean;
}

export enum MaterialCategory {
  MEAT = "meat",
  VEGETABLES = "vegetables",
  DAIRY = "dairy",
  BEVERAGES = "beverages",
  CONDIMENTS = "condiments",
  GRAINS = "grains",
  SPICES = "spices",
  PACKAGING = "packaging",
  OTHER = "other"
}

export enum MeasurementUnit {
  KG = "kg",
  GRAMS = "grams",
  LITERS = "liters",
  ML = "ml",
  PIECES = "pieces",
  PACKS = "packs",
  BOXES = "boxes",
  BOTTLES = "bottles"
}

export interface CreateRawMaterialInput {
  name: string;
  description?: string;
  category: MaterialCategory;
  unit: MeasurementUnit;
  unitCost: number;
  supplier?: string;
  minStockLevel: number;
  maxStockLevel: number;
}

export interface UpdateRawMaterialInput extends Partial<CreateRawMaterialInput> {
  id: string;
  isActive?: boolean;
}

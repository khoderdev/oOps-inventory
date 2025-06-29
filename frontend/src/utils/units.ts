import { MeasurementUnit, type RawMaterial } from "../types";

// Unit categories for better organization
export enum UnitCategory {
  WEIGHT = "weight",
  VOLUME = "volume",
  COUNT = "count",
  LENGTH = "length",
  AREA = "area"
}

// Unit metadata with conversion factors and display info
export interface UnitMetadata {
  category: UnitCategory;
  step: string;
  precision: number;
  symbol: string;
  name: string;
  baseUnit?: MeasurementUnit; // For conversions
  conversionFactor?: number; // To base unit
}

// Comprehensive unit metadata mapping
export const UNIT_METADATA: Record<MeasurementUnit, UnitMetadata> = {
  [MeasurementUnit.KG]: {
    category: UnitCategory.WEIGHT,
    step: "0.1",
    precision: 1,
    symbol: "kg",
    name: "Kilograms",
    baseUnit: MeasurementUnit.GRAMS,
    conversionFactor: 1000
  },
  [MeasurementUnit.GRAMS]: {
    category: UnitCategory.WEIGHT,
    step: "1",
    precision: 0,
    symbol: "g",
    name: "Grams",
    baseUnit: MeasurementUnit.GRAMS,
    conversionFactor: 1
  },
  [MeasurementUnit.LITERS]: {
    category: UnitCategory.VOLUME,
    step: "0.1",
    precision: 1,
    symbol: "L",
    name: "Liters",
    baseUnit: MeasurementUnit.ML,
    conversionFactor: 1000
  },
  [MeasurementUnit.ML]: {
    category: UnitCategory.VOLUME,
    step: "1",
    precision: 0,
    symbol: "ml",
    name: "Milliliters",
    baseUnit: MeasurementUnit.ML,
    conversionFactor: 1
  },
  [MeasurementUnit.PIECES]: {
    category: UnitCategory.COUNT,
    step: "1",
    precision: 0,
    symbol: "pcs",
    name: "Pieces",
    baseUnit: MeasurementUnit.PIECES,
    conversionFactor: 1
  },
  [MeasurementUnit.BOTTLES]: {
    category: UnitCategory.COUNT,
    step: "1",
    precision: 0,
    symbol: "bottles",
    name: "Bottles",
    baseUnit: MeasurementUnit.BOTTLES,
    conversionFactor: 1
  },
  [MeasurementUnit.PACKS]: {
    category: UnitCategory.COUNT,
    step: "1",
    precision: 0,
    symbol: "packs",
    name: "Packs",
    baseUnit: MeasurementUnit.PIECES,
    conversionFactor: 1 // Will be overridden by unitsPerPack
  },
  [MeasurementUnit.BOXES]: {
    category: UnitCategory.COUNT,
    step: "1",
    precision: 0,
    symbol: "boxes",
    name: "Boxes",
    baseUnit: MeasurementUnit.PIECES,
    conversionFactor: 1 // Will be overridden by unitsPerPack
  }
};

// Enhanced step value calculation with proper typing
export const getStepValue = (unit: MeasurementUnit): string => {
  return UNIT_METADATA[unit]?.step ?? "1";
};

// Get unit metadata
export const getUnitMetadata = (unit: MeasurementUnit): UnitMetadata => {
  return UNIT_METADATA[unit] ?? UNIT_METADATA[MeasurementUnit.PIECES];
};

// Get unit category
export const getUnitCategory = (unit: MeasurementUnit): UnitCategory => {
  return getUnitMetadata(unit).category;
};

// Format quantity with proper precision and symbol
export const formatQuantity = (
  quantity: number,
  unit: MeasurementUnit,
  options?: {
    showSymbol?: boolean;
    precision?: number;
    compact?: boolean;
  }
): string => {
  const metadata = getUnitMetadata(unit);
  const precision = options?.precision ?? metadata.precision;
  const symbol = options?.showSymbol !== false ? metadata.symbol : metadata.name;

  let formattedQuantity = quantity.toFixed(precision);

  // Remove trailing zeros for whole numbers
  if (precision > 0) {
    formattedQuantity = parseFloat(formattedQuantity).toString();
  }

  if (options?.compact) {
    return `${formattedQuantity}${symbol}`;
  }

  return `${formattedQuantity} ${symbol}`;
};

// Convert between units of the same category
export const convertUnit = (value: number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit, packInfo?: { unitsPerPack: number; baseUnit: MeasurementUnit }): number => {
  const fromMetadata = getUnitMetadata(fromUnit);
  const toMetadata = getUnitMetadata(toUnit);

  // Handle pack/box conversions
  if (packInfo && (fromUnit === MeasurementUnit.PACKS || fromUnit === MeasurementUnit.BOXES)) {
    if (toUnit === packInfo.baseUnit) {
      return value * packInfo.unitsPerPack;
    }
  }

  if (packInfo && (toUnit === MeasurementUnit.PACKS || toUnit === MeasurementUnit.BOXES)) {
    if (fromUnit === packInfo.baseUnit) {
      return value / packInfo.unitsPerPack;
    }
  }

  // Same category conversions
  if (fromMetadata.category === toMetadata.category) {
    const fromFactor = fromMetadata.conversionFactor ?? 1;
    const toFactor = toMetadata.conversionFactor ?? 1;
    return (value * fromFactor) / toFactor;
  }

  // Cannot convert between different categories
  throw new Error(`Cannot convert from ${fromUnit} to ${toUnit} - different categories`);
};

// Helper function to get consumed unit label
export const getConsumedUnitLabel = (item: { quantity: number; rawMaterial?: RawMaterial }) => {
  if (!item.rawMaterial) return "Used";

  const material = item.rawMaterial;
  const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;

  if (isPackOrBox) {
    const packInfo = material as unknown as { unitsPerPack?: number; baseUnit?: string };
    const unitsPerPack = packInfo.unitsPerPack || 1;

    // For pack/box materials, always show the pack quantity with 1 decimal place
    const packQuantity = item.quantity / unitsPerPack;
    return `Used ${packQuantity.toFixed(1)} ${material.unit}`;
  }

  return `Used ${item.quantity} ${material.unit}`;
};

// Helper function to split quantity and unit for styling
export const splitQuantityAndUnit = (displayText: string) => {
  const parts = displayText.split(' ');
  if (parts.length >= 2) {
    const quantity = parts[0];
    const unit = parts.slice(1).join(' ');
    return { quantity, unit };
  }
  return { quantity: displayText, unit: '' };
};

// Validate unit compatibility
export const areUnitsCompatible = (unit1: MeasurementUnit, unit2: MeasurementUnit): boolean => {
  return getUnitCategory(unit1) === getUnitCategory(unit2);
};

// Get available units for a category
export const getUnitsByCategory = (category: UnitCategory): MeasurementUnit[] => {
  return Object.entries(UNIT_METADATA)
    .filter(([, metadata]) => metadata.category === category)
    .map(([unit]) => unit as MeasurementUnit);
};

// Get human-readable unit name
export const getUnitName = (unit: MeasurementUnit): string => {
  return getUnitMetadata(unit).name;
};

// Get unit symbol
export const getUnitSymbol = (unit: MeasurementUnit): string => {
  return getUnitMetadata(unit).symbol;
};

// Check if unit is countable
export const isCountableUnit = (unit: MeasurementUnit): boolean => {
  return getUnitCategory(unit) === UnitCategory.COUNT;
};

// Check if unit is weight
export const isWeightUnit = (unit: MeasurementUnit): boolean => {
  return getUnitCategory(unit) === UnitCategory.WEIGHT;
};

// Check if unit is volume
export const isVolumeUnit = (unit: MeasurementUnit): boolean => {
  return getUnitCategory(unit) === UnitCategory.VOLUME;
};

// Get precision for a unit
export const getUnitPrecision = (unit: MeasurementUnit): number => {
  return getUnitMetadata(unit).precision;
};

// Round to unit precision
export const roundToUnitPrecision = (value: number, unit: MeasurementUnit): number => {
  const precision = getUnitPrecision(unit);
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
};

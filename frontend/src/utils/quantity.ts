import { MeasurementUnit } from "../types";

// Helper function to format quantity display for pack/box materials
export const formatQuantityDisplay = (quantity: number, material: { unit: string; unitsPerPack?: number; baseUnit?: string } | undefined) => {
  if (!material) return `${quantity}`;

  const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
  if (isPackOrBox) {
    const unitsPerPack = material.unitsPerPack || 1;
    const baseUnit = material.baseUnit || "pieces";
    const packQuantity = quantity / unitsPerPack;
    return `${packQuantity.toFixed(1)} ${material.unit} (${quantity} ${baseUnit})`;
  }

  return `${quantity} ${material.unit}`;
};

// Helper function to format currency values
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const roundToTwoDecimals = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

// Helper function to format quantity display for pack/box materials
export const formatPacksBoxQuantityDisplay = (quantity: number, material: { unit: string; unitsPerPack?: number; baseUnit?: string } | undefined) => {
  if (!material) return `${quantity}`;

  const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
  if (isPackOrBox) {
    const unitsPerPack = material.unitsPerPack || 1;
    const baseUnit = material.baseUnit || "pieces";
    const packQuantity = quantity / unitsPerPack;
    return `${packQuantity.toFixed(1)} ${material.unit} (${quantity} ${baseUnit})`;
  }

  return `${quantity} ${material.unit}`;
};

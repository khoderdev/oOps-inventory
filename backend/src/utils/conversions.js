/**
 * Gets conversion information for a raw material
 */
export const getConversionInfo = rawMaterial => {
  if (!rawMaterial) return null;

  const unit = rawMaterial.unit?.toUpperCase();
  const isWeight = unit === "KG";
  const isVolume = unit === "LITERS";
  const isPack = unit === "PACKS" || unit === "BOXES";

  if (isWeight) {
    return {
      baseUnit: "GRAMS",
      conversionFactor: 1000,
      isConvertible: true
    };
  } else if (isVolume) {
    return {
      baseUnit: "MILLILITERS",
      conversionFactor: 1000,
      isConvertible: true
    };
  } else if (isPack) {
    return {
      baseUnit: rawMaterial.base_unit || "PIECES",
      conversionFactor: rawMaterial.units_per_pack || 1,
      isConvertible: true
    };
  }

  return {
    baseUnit: unit,
    conversionFactor: 1,
    isConvertible: false
  };
};

/**
 * Helper function to get pack information from raw material
 */
export const getPackInfo = rawMaterial => {
  const isPackOrBox = rawMaterial.unit === "PACKS" || rawMaterial.unit === "BOXES";
  if (!isPackOrBox) return null;

  return {
    unitsPerPack: rawMaterial.units_per_pack || 1,
    baseUnit: rawMaterial.base_unit || "PIECES",
    packUnit: rawMaterial.unit
  };
};

/**
 * Helper function to convert pack quantity to base units
 */
export const convertPackToBase = (quantity, rawMaterial) => {
  const packInfo = getPackInfo(rawMaterial);
  if (!packInfo) return quantity;
  return quantity * packInfo.unitsPerPack;
};

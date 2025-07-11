import type { RecipeIngredient } from "../types/recipes.types";

// export const getEffectiveUnitCost = (ingredient: RecipeIngredient): number => {
//   const raw = ingredient.raw_material;
//   if (!raw) return 0;

//   const materialUnit = raw.unit; // e.g. "PACKS"
//   const materialUnitCost = parseFloat(raw.unit_cost.toString() || "0");
//   const ingredientUnit = ingredient.raw_material?.unit;
//   const unitsPerPack = raw.unitsPerPack || 1;

//   // Convert if raw material is sold in PACKS and used in PIECES (or base units)
//   if ((materialUnit === "PACKS" || materialUnit === "BOXES") && ingredientUnit !== materialUnit) {
//     return materialUnitCost / unitsPerPack;
//   }

//   return materialUnitCost;
// };

////////////////////////////////////////////////

// export const getEffectiveUnitCost = (ingredient: RecipeIngredient) => {
//   const rawMaterial = ingredient.raw_material;

//   if (!rawMaterial) return 0;

//   // If the ingredient is already in the purchase unit, just return unit_cost
//   if (ingredient.baseUnit === rawMaterial.unit) {
//     return parseFloat(rawMaterial.costPerBaseUnit || "0");
//   }

//   // If there's a direct cost_per_base_unit, use that
//   if (rawMaterial.costPerBaseUnit) {
//     return parseFloat(rawMaterial.costPerBaseUnit);
//   }

//   // Calculate based on units_per_pack if available
//   if (rawMaterial.unitsPerPack) {
//     const packCost = parseFloat(rawMaterial.costPerBaseUnit);
//     const unitsPerPack = parseFloat(rawMaterial.unitsPerPack.toString());
//     return packCost / unitsPerPack;
//   }

//   // Fallback to unit_cost if no conversion available
//   return parseFloat(rawMaterial.costPerBaseUnit);
// };

////////////////////////////////////////////////////////

export const getEffectiveUnitCost = (ingredient: RecipeIngredient) => {
  const rawMaterial = ingredient.raw_material;
  if (!rawMaterial) return 0;

  // For PIECES and BOTTLES (individual units)
  if (ingredient.baseUnit === "PIECES" || ingredient.baseUnit === "BOTTLES") {
    // First try cost_per_individual_unit if available
    if (rawMaterial.cost_per_individual_unit) {
      return parseFloat(rawMaterial.cost_per_individual_unit.toString());
    }
    // Then fall back to unit_cost
    return parseFloat(rawMaterial.cost_per_base_unit.toString() || "0");
  }

  // For other units (GRAMS, KG, etc.)
  // If the ingredient is already in the purchase unit, use unit_cost
  if (ingredient.baseUnit === rawMaterial.unit) {
    return parseFloat(rawMaterial.unit_cost?.toString() || "0");
  }

  // If there's a direct cost_per_base_unit, use that
  if (rawMaterial.cost_per_base_unit) {
    return parseFloat(rawMaterial.cost_per_base_unit.toString());
  }

  // Calculate based on units_per_pack if available
  if (rawMaterial.units_per_pack) {
    const packCost = parseFloat(rawMaterial.unit_cost?.toString() || "0");
    const unitsPerPack = parseFloat(rawMaterial.units_per_pack.toString());
    return packCost / unitsPerPack;
  }

  // Final fallback to unit_cost
  return parseFloat(rawMaterial.unit_cost?.toString() || "0");
};

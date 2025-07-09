import type { RecipeIngredient } from "../types/recipes.types";

export const getEffectiveUnitCost = (ingredient: RecipeIngredient): number => {
  const raw = ingredient.raw_material;
  if (!raw) return 0;

  const materialUnit = raw.unit; // e.g. "PACKS"
  const materialUnitCost = parseFloat(raw.unit_cost.toString() || "0");
  const ingredientUnit = ingredient.raw_material?.unit;
  const unitsPerPack = raw.unitsPerPack || 1;

  // Convert if raw material is sold in PACKS and used in PIECES (or base units)
  if ((materialUnit === "PACKS" || materialUnit === "BOXES") && ingredientUnit !== materialUnit) {
    return materialUnitCost / unitsPerPack;
  }

  return materialUnitCost;
};

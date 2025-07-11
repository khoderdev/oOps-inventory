// export const getEffectiveUnitCost = ingredient => {
//   const raw = ingredient.raw_material;
//   if (!raw) return 0;

//   const materialUnit = raw.unit; // e.g. "PACKS"
//   const unitCost = parseFloat(raw.unit_cost || 0);
//   const ingredientUnit = ingredient.unit;
//   const unitsPerPack = raw.unitsPerPack || 1;

//   // Convert PACKS → PIECES
//   if ((materialUnit === "PACKS" || materialUnit === "BOXES") && ingredientUnit !== materialUnit && unitsPerPack > 0) {
//     return unitCost / unitsPerPack;
//   }

//   return unitCost;
// };

export const getEffectiveUnitCost = ingredient => {
  const raw = ingredient.raw_material;
  if (!raw) return 0;

  const materialUnit = raw.unit?.toUpperCase();
  const ingredientUnit = ingredient.unit?.toUpperCase();
  const baseUnit = ingredient.baseUnit?.toUpperCase();
  const unitCost = parseFloat(raw.unit_cost || "0");
  const costPerBaseUnit = parseFloat(raw.cost_per_base_unit || "0");
  const costPerIndividualUnit = parseFloat(raw.cost_per_individual_unit || "0");
  const unitsPerPack = parseFloat(raw.units_per_pack || "1");

  // Handle individual units (PIECES, BOTTLES)
  if (baseUnit === "PIECES" || baseUnit === "BOTTLES") {
    if (costPerIndividualUnit > 0) return costPerIndividualUnit;
    return unitCost;
  }

  // Handle cases where we have direct cost_per_base_unit
  if (costPerBaseUnit > 0) return costPerBaseUnit;

  // Convert PACKS/BOXES to base units
  if ((materialUnit === "PACKS" || materialUnit === "BOXES") && ingredientUnit !== materialUnit && unitsPerPack > 1) {
    return unitCost / unitsPerPack;
  }

  // Default case - use unit_cost directly
  return unitCost;
};

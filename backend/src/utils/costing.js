export const getEffectiveUnitCost = ingredient => {
  const raw = ingredient.raw_material;
  if (!raw) return 0;

  const materialUnit = raw.unit; // e.g. "PACKS"
  const unitCost = parseFloat(raw.unit_cost || 0);
  const ingredientUnit = ingredient.unit;
  const unitsPerPack = raw.unitsPerPack || 1;

  // Convert PACKS → PIECES
  if ((materialUnit === "PACKS" || materialUnit === "BOXES") && ingredientUnit !== materialUnit && unitsPerPack > 0) {
    return unitCost / unitsPerPack;
  }

  return unitCost;
};

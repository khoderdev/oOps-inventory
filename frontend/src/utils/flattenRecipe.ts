const MAX_INGREDIENTS = 5;
const MAX_BREAKDOWN_ITEMS = 5;

function flattenRecipe(recipe: any) {
  const flat: Record<string, any> = {};

  // Flatten root level simple keys
  const rootKeys = ["id", "name", "description", "category", "instructions", "serving_cost", "is_active", "created_by", "created_at", "updated_at"];
  for (const key of rootKeys) {
    flat[key] = recipe[key];
  }

  // Flatten creator object
  if (recipe.creator) {
    for (const [k, v] of Object.entries(recipe.creator)) {
      flat[`creator_${k}`] = v;
    }
  }

  // Flatten costAnalysis: totalCost + breakdown (array)
  if (recipe.costAnalysis) {
    flat["costAnalysis_totalCost"] = recipe.costAnalysis.totalCost;
    if (Array.isArray(recipe.costAnalysis.breakdown)) {
      recipe.costAnalysis.breakdown.slice(0, MAX_BREAKDOWN_ITEMS).forEach((item: any, i: number) => {
        for (const [k, v] of Object.entries(item)) {
          flat[`costAnalysis_breakdown_${i + 1}_${k}`] = v;
        }
      });
    }
  }

  // Flatten ingredients array
  if (Array.isArray(recipe.ingredients)) {
    recipe.ingredients.slice(0, MAX_INGREDIENTS).forEach((ingredient: any, i: number) => {
      // Flatten ingredient's own properties
      for (const [k, v] of Object.entries(ingredient)) {
        if (k !== "raw_material") {
          flat[`ingredient_${i + 1}_${k}`] = v;
        }
      }

      // Flatten nested raw_material
      if (ingredient.raw_material) {
        for (const [k, v] of Object.entries(ingredient.raw_material)) {
          flat[`ingredient_${i + 1}_raw_material_${k}`] = v;
        }
      }
    });
  }

  // Flatten menu_items if needed — here just store count or serialize
  if (Array.isArray(recipe.menu_items)) {
    flat["menu_items_count"] = recipe.menu_items.length;
    // Optionally flatten more if required
  }

  return flat;
}

export default flattenRecipe;

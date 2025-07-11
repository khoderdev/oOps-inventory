// import { useEffect, useState } from "react";
// import { useRecipeCost } from "../../../hooks/useRecipes";
// import { formatCurrency } from "../../../utils/quantity";

// interface RecipeCostCellProps {
//   recipeId: number;
// }

// export const RecipeCostCell: React.FC<RecipeCostCellProps> = ({ recipeId }) => {
//   const { data: costData, isLoading, error } = useRecipeCost(recipeId);
//   const [cost, setCost] = useState<number | null>(null);

//   useEffect(() => {
//     if (costData) {
//       // Check both possible locations for the cost data
//       const totalCost = costData.costAnalysis?.totalCost || costData.totalCost;
//       setCost(totalCost || null);
//     } else {
//       setCost(null);
//     }
//   }, [costData]);

//   if (isLoading) return <span className="text-sm text-gray-400">Loading...</span>;
//   if (error) return <span className="text-sm text-red-500">Failed to load</span>;
//   if (cost === null) return <span className="text-sm text-gray-400">N/A</span>;

//   return <span className="text-sm text-gray-800 dark:text-gray-200">{formatCurrency(cost)}</span>;
// };

import React from "react";
import type { Recipe } from "../../../types/recipes.types";
import { getEffectiveUnitCost } from "../../../utils/costing";
import { formatCurrency } from "../../../utils/quantity";

interface RecipeCostCellProps {
  recipe: Pick<Recipe, "id" | "ingredients">;
}

export const RecipeCostCell: React.FC<RecipeCostCellProps> = ({ recipe }) => {
  const calculateTotalCost = () => {
    if (!recipe.ingredients) return 0;
    return recipe.ingredients.reduce((total, ing) => {
      // Convert string quantities to numbers if needed
      const quantity = typeof ing.quantity === "string" ? parseFloat(ing.quantity) : ing.quantity || 0;

      return total + quantity * (getEffectiveUnitCost(ing) || 0);
    }, 0);
  };

  const totalCost = calculateTotalCost();

  return <span className="text-sm text-gray-800 dark:text-gray-200">{formatCurrency(totalCost)}</span>;
};

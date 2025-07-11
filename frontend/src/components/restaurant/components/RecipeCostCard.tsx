// import React from "react";
// import { useRecipeCost } from "../../../hooks/useRecipes";
// import { MenuCategory, type Recipe } from "../../../types";
// import { formatCurrency } from "../../../utils/quantity";
// import { Button } from "../../ui";
// import { CategoryBadge } from "../components/CategoryBadge";

// interface RecipeCostCardProps {
//   recipe: Recipe;
//   onViewCost: (recipe: Recipe) => void;
// }

// export const RecipeCostCard: React.FC<RecipeCostCardProps> = ({ recipe, onViewCost }) => {
//   const { data: costData, isLoading, error } = useRecipeCost(recipe.id);

//   return (
//     <div className="bg-white rounded-lg border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
//       <div className="flex items-center justify-between mb-4">
//         <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">{recipe.name}</h4>
//         <CategoryBadge category={recipe.category as MenuCategory} />
//       </div>

//       <div className="space-y-3">
//         <div className="flex justify-between">
//           <span className="text-sm text-gray-500 dark:text-gray-400">Total Cost</span>
//           <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{isLoading ? "Loading..." : error ? "Error" : formatCurrency(costData?.totalCost || 0)}</span>
//         </div>
//         <div className="flex justify-between">
//           <span className="text-sm text-gray-500 dark:text-gray-400">Ingredients</span>
//           <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{recipe.ingredients?.length || 0} items</span>
//         </div>
//       </div>

//       <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
//         <Button size="sm" variant="outline" className="w-full" onClick={() => onViewCost(recipe)}>
//           View Cost Breakdown
//         </Button>
//       </div>
//     </div>
//   );
// };
import React from "react";
import { useRecipeCost } from "../../../hooks/useRecipes";
import { MenuCategory, type Recipe } from "../../../types";
import { formatCurrency } from "../../../utils/quantity";
import { Button } from "../../ui";
import { CategoryBadge } from "../components/CategoryBadge";

interface RecipeCostCardProps {
  recipe: Recipe;
  onViewCost: (recipe: Recipe) => void;
}

export const RecipeCostCard: React.FC<RecipeCostCardProps> = ({ recipe, onViewCost }) => {
  const { data: costData, isLoading, error } = useRecipeCost(recipe.id);

  // Calculate total cost - check both possible locations for the data
  const totalCost = costData?.costAnalysis?.totalCost || costData?.totalCost || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">{recipe.name}</h4>
        <CategoryBadge category={recipe.category as MenuCategory} />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total Cost</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{isLoading ? "Loading..." : error ? "Error" : formatCurrency(totalCost)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Ingredients</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{recipe.ingredients?.length || 0} items</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button size="sm" variant="outline" className="w-full" onClick={() => onViewCost(recipe)}>
          View Cost Breakdown
        </Button>
      </div>
    </div>
  );
};

import React from "react";
import type { Recipe } from "../../../types";
import { Button } from "../../ui";
import { RecipeCostCard } from "./RecipeCostCard";

interface CostingViewProps {
  recipes: Recipe[];
  onBack: () => void;
  onViewCostBreakdown: (recipe: Recipe) => void;
}

export const CostingView: React.FC<CostingViewProps> = ({ recipes, onBack, onViewCostBreakdown }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recipe Costing Analysis</h3>
        <Button variant="outline" onClick={onBack}>
          ← Back to Recipes
        </Button>
      </div>

      {/* Recipe Cost Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.slice(0, 6).map(recipe => (
          <RecipeCostCard key={recipe.id} recipe={recipe} onViewCost={onViewCostBreakdown} />
        ))}
      </div>
    </div>
  );
};

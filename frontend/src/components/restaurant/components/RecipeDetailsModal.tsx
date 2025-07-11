import { Calculator, ClipboardList, Pencil } from "lucide-react";
import React from "react";
import { MenuCategory } from "../../../types";
import type { Recipe } from "../../../types/recipes.types";
import { getEffectiveUnitCost } from "../../../utils/costing";
import { Button, Modal } from "../../ui";
import { CategoryBadge } from "../components/CategoryBadge";

interface RecipeDetailsModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCostAnalysis: () => void;
}

export const RecipeDetailsModal: React.FC<RecipeDetailsModalProps> = ({ recipe, isOpen, onClose, onEdit, onCostAnalysis }) => {
  if (!recipe)
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Recipe Details" size="xl">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-400 mb-4 dark:text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No recipe selected</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Select a recipe to view its details</p>
        </div>
      </Modal>
    );

  const calculateTotalCost = () => {
    if (!recipe.ingredients) return 0;
    return recipe.ingredients.reduce((total, ing) => total + (ing.quantity || 0) * (getEffectiveUnitCost(ing) || 0), 0);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Recipe Details: ${recipe.name}`} size="xl">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{recipe.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <CategoryBadge category={recipe.category as MenuCategory} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={onCostAnalysis}>
              <Calculator className="w-4 h-4 mr-2" />
              Cost Analysis
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Ingredients</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{recipe.ingredients.length}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Cost</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">${calculateTotalCost().toFixed(2)}</p>
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Ingredients</h4>
            <span className="text-sm text-gray-500 dark:text-gray-400">{recipe.ingredients.reduce((sum, ing) => sum + ing.quantity, 0)} total units</span>
          </div>
          <div className="border rounded-lg overflow-hidden dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ingredient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Cost</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {recipe.ingredients.map((ingredient, i) => {
                  const costPerBaseUnit = getEffectiveUnitCost(ingredient);
                  const totalCost = ingredient.quantity * costPerBaseUnit;
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{ingredient.raw_material?.name || "Unknown"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {ingredient.quantity} {ingredient.baseUnit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${costPerBaseUnit.toFixed(4)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${totalCost.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructions */}
        {recipe.instructions && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Instructions</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              {recipe.instructions
                .split("\n")
                .filter(Boolean)
                .map((step, i) => (
                  <li key={i} className="pl-2">
                    {step}
                  </li>
                ))}
            </ol>
          </div>
        )}
      </div>
    </Modal>
  );
};

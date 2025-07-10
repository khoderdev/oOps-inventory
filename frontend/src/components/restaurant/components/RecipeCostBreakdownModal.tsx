// RecipeCostBreakdownModal.tsx

import React from "react";
import type { Recipe } from "../../../types";
import { formatCurrency } from "../../../utils/quantity";
import { Modal } from "../../ui";

interface Props {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
}

export const RecipeCostBreakdownModal: React.FC<Props> = ({ recipe, isOpen, onClose }) => {
  const costAnalysis = recipe.costAnalysis;

  if (!costAnalysis) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={`Cost Breakdown - ${recipe.name}`} size="lg">
        <div className="p-6 text-center text-gray-500 dark:text-gray-300">No cost data available for this recipe.</div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cost Breakdown - ${recipe.name}`} size="lg">
      <div className="p-4 space-y-4">
        <p className="text-gray-700 dark:text-gray-200">
          <strong>Total Cost:</strong> {formatCurrency(costAnalysis.totalCost)}
        </p>
        <div className="space-y-2 divide-y divide-gray-200 dark:divide-gray-700">
          {costAnalysis.breakdown.map((item, index) => (
            <div key={index} className="py-2 flex justify-between text-sm text-gray-800 dark:text-gray-100">
              <span>{item.materialName}</span>
              <span>
                {item.quantity} {item.unit} × {formatCurrency(item.unitCost)} = {formatCurrency(item.totalCost)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

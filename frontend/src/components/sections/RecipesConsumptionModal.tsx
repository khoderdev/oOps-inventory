import { useEffect, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useRecordRecipeConsumption } from "../../hooks/useSections";

import type { Recipe, Section } from "../../types";
import { useOrderIdCounter } from "../../utils/orderId";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface RecipesConsumptionModalProps {
  section: Section;
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RecipesConsumptionModal = ({ section, recipe, isOpen, onClose, onSuccess }: RecipesConsumptionModalProps) => {
  const { state } = useApp();
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("recipe_preparation");
  const { generateNextOrderId } = useOrderIdCounter();
  const { mutateAsync, isPending } = useRecordRecipeConsumption();

  // Generate a new order ID when the modal opens
  useEffect(() => {
    if (isOpen) {
      setOrderId(generateNextOrderId());
    }
  }, [isOpen, generateNextOrderId]);

  const handleSubmit = async () => {
    if (!state?.user?.id) return;

    try {
      await mutateAsync({
        recipeId: recipe.id,
        sectionId: section.id,
        consumedBy: Number(state.user?.id || ""),
        orderId
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error recording recipe consumption:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Consumption - ${recipe.name}`} size="xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipe Ingredients Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 h-full">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Recipe Ingredients</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{ingredient.raw_material?.name}</span>
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                    {ingredient.quantity} {ingredient.raw_material?.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Consumption Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Consumption Details</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order/Reference ID</label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <span className="text-green-600 dark:text-green-400 font-medium">{orderId}</span>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Consumption
                </label>
                <select id="reason" value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <option value="preparation_cooking">Cooking/Preparation</option>
                  <option value="staff_internal">Staff/Internal</option>
                  <option value="waste">Waste</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="px-6 py-2.5 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} loading={isPending} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500">
              Record Consumption
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RecipesConsumptionModal;

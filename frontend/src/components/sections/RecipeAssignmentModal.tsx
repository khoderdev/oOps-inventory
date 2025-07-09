import { useEffect, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useAssignRecipeToSection } from "../../hooks/useSections";
import type { Recipe, Section } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

interface RecipeAssignmentModalProps {
  section: Section | null;
  recipes: Recipe[] | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RecipeAssignmentModal = ({ section, recipes, isOpen, onClose, onSuccess }: RecipeAssignmentModalProps) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { state } = useApp();
  const assignMutation = useAssignRecipeToSection();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedRecipeId("");
      setQuantity(1);
      setErrors({});
    }
  }, [isOpen]);

  const recipeOptions =
    recipes?.map(recipe => ({
      value: String(recipe.id),
      label: recipe.name
    })) || [];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedRecipeId) {
      newErrors.selectedRecipeId = "Please select a recipe";
    }

    if (quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!section || !validateForm()) {
      return;
    }

    try {
      const assignmentData = {
        sectionId: section.id,
        recipeId: Number(selectedRecipeId),
        quantity: quantity,
        assignedBy: Number(state.user?.id || "1"),
        notes: `Recipe assigned to ${section.name}`
      };

      await assignMutation.mutateAsync(assignmentData);

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error assigning recipe:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (field === "selectedRecipeId") {
      setSelectedRecipeId(value as string);
    } else if (field === "quantity") {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      setQuantity(numValue || 0);
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!section) return null;

  const selectedRecipe = recipes?.find(recipe => recipe.id === Number(selectedRecipeId));
  const isLoading = assignMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Recipe to ${section.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Select
            label="Select Recipe"
            options={[{ value: "", label: "Choose a recipe..." }, ...recipeOptions]}
            value={selectedRecipeId}
            onChange={value => {
              if (value !== null) {
                handleInputChange("selectedRecipeId", value);
              }
            }}
            error={errors.selectedRecipeId}
            required
          />

          {selectedRecipe && (
            <div className="bg-blue-50 p-4 rounded-lg dark:bg-blue-900/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-300">Recipe Category:</p>
                  <p className="text-blue-700 dark:text-blue-100 font-bold">{selectedRecipe.category || "Uncategorized"}</p>
                </div>
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-300">Ingredients:</p>
                  <p className="text-blue-700 dark:text-blue-100 font-bold">{selectedRecipe.ingredients.length}</p>
                </div>
                {selectedRecipe.costAnalysis && (
                  <div className="col-span-2">
                    <p className="font-medium text-blue-900 dark:text-blue-300">Total Cost:</p>
                    <p className="text-blue-700 dark:text-blue-100 font-bold">${selectedRecipe.costAnalysis.totalCost.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity to Assign</label>
            </div>
            <Input type="number" min="1" step="1" value={quantity} onChange={e => handleInputChange("quantity", parseFloat(e.target.value) || 0)} error={errors.quantity} required helperText="Enter the number of servings/portions" disabled={!selectedRecipeId} />
          </div>

          {quantity > 0 && selectedRecipe && selectedRecipe.costAnalysis && (
            <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900/10">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Cost:</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-300">${(quantity * selectedRecipe.costAnalysis.totalCost).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} disabled={!selectedRecipeId || quantity <= 0}>
            Assign Recipe
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecipeAssignmentModal;

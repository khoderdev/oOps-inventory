import React, { useEffect, useState } from "react";
import type { CreateRecipeRequest, Recipe } from "../../types";
import { Button, Input } from "../ui";

interface RecipeFormProps {
  recipe?: Recipe | null;
  onSubmit: (data: CreateRecipeRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<CreateRecipeRequest>({
    name: "",
    description: "",
    category: "",
    serving_size: 1,
    prep_time: 0,
    cook_time: 0,
    instructions: "",
    margin_percentage: 30,
    ingredients: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name,
        description: recipe.description || "",
        category: recipe.category || "",
        serving_size: recipe.serving_size,
        prep_time: recipe.prep_time || 0,
        cook_time: recipe.cook_time || 0,
        instructions: recipe.instructions || "",
        margin_percentage: recipe.margin_percentage || 30,
        ingredients: recipe.ingredients.map(ing => ({
          raw_material_id: ing.raw_material_id,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes
        }))
      });
    }
  }, [recipe]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Recipe name is required";
    }

    if (formData.serving_size <= 0) {
      newErrors.serving_size = "Serving size must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof CreateRecipeRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Recipe Name *</label>
          <Input type="text" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} required />
          {errors.name && <p className="text-sm text-red-600 mt-1 dark:text-red-400">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Category</label>
          <Input type="text" value={formData.category || ""} onChange={e => handleInputChange("category", e.target.value)} placeholder="e.g., Appetizer, Main Course" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Description</label>
        <Input type="text" value={formData.description || ""} onChange={e => handleInputChange("description", e.target.value)} placeholder="Brief description of the recipe" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Serving Size *</label>
          <Input type="number" value={formData.serving_size} onChange={e => handleInputChange("serving_size", parseInt(e.target.value) || 1)} min="1" required />
          {errors.serving_size && <p className="text-sm text-red-600 mt-1 dark:text-red-400">{errors.serving_size}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Prep Time (minutes)</label>
          <Input type="number" value={formData.prep_time || ""} onChange={e => handleInputChange("prep_time", parseInt(e.target.value) || 0)} min="0" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Cook Time (minutes)</label>
          <Input type="number" value={formData.cook_time || ""} onChange={e => handleInputChange("cook_time", parseInt(e.target.value) || 0)} min="0" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Margin Percentage (%)</label>
        <Input type="number" value={formData.margin_percentage || ""} onChange={e => handleInputChange("margin_percentage", parseFloat(e.target.value) || 0)} min="0" max="100" step="0.1" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Instructions</label>
        <Input value={formData.instructions || ""} onChange={e => handleInputChange("instructions", e.target.value)} rows={6} placeholder="Step-by-step cooking instructions" />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : recipe ? "Update Recipe" : "Create Recipe"}
        </Button>
      </div>
    </form>
  );
};

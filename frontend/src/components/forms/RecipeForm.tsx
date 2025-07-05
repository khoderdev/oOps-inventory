import React, { useEffect, useState } from "react";
import type { CreateRecipeRequest, Recipe } from "../../types";
import { Button } from "../ui";

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name *</label>
          <input type="text" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input type="text" value={formData.category || ""} onChange={e => handleInputChange("category", e.target.value)} placeholder="e.g., Appetizer, Main Course" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={formData.description || ""} onChange={e => handleInputChange("description", e.target.value)} rows={2} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Brief description of the recipe" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Serving Size *</label>
          <input type="number" value={formData.serving_size} onChange={e => handleInputChange("serving_size", parseInt(e.target.value) || 1)} min="1" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
          {errors.serving_size && <p className="text-sm text-red-600 mt-1">{errors.serving_size}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (minutes)</label>
          <input type="number" value={formData.prep_time || ""} onChange={e => handleInputChange("prep_time", parseInt(e.target.value) || 0)} min="0" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cook Time (minutes)</label>
          <input type="number" value={formData.cook_time || ""} onChange={e => handleInputChange("cook_time", parseInt(e.target.value) || 0)} min="0" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Margin Percentage (%)</label>
        <input type="number" value={formData.margin_percentage || ""} onChange={e => handleInputChange("margin_percentage", parseFloat(e.target.value) || 0)} min="0" max="100" step="0.1" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
        <textarea value={formData.instructions || ""} onChange={e => handleInputChange("instructions", e.target.value)} rows={6} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Step-by-step cooking instructions" />
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

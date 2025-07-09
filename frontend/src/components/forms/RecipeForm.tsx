import { Plus, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import type { CreateRecipeRequest, RawMaterial, Recipe, RecipeIngredient } from "../../types";
import { unitConversionMap } from "../../utils/units";
import { Button, Input, Select } from "../ui";

interface RecipeFormProps {
  recipe?: Recipe | null;
  onSubmit: (data: CreateRecipeRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
  rawMaterials: RawMaterial[];
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onSubmit, onCancel, isLoading = false, rawMaterials = [] }) => {
  const materials = useMemo(() => (Array.isArray(rawMaterials) ? rawMaterials : []), [rawMaterials]);
  const [formData, setFormData] = useState<CreateRecipeRequest>({
    name: "",
    category: "",
    instructions: "",
    ingredients: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ingredientErrors, setIngredientErrors] = useState<Record<number, Record<string, string>>>({});

  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name,
        category: recipe.category || "",
        instructions: recipe.instructions || "",
        ingredients: recipe.ingredients.map(ing => ({
          raw_material_id: ing.raw_material_id,
          quantity: ing.quantity,
          baseUnit: ing.baseUnit
        }))
      });

      const initialIngredientErrors: Record<number, Record<string, string>> = {};
      recipe.ingredients.forEach((_, index) => {
        initialIngredientErrors[index] = {};
      });
      setIngredientErrors(initialIngredientErrors);
    }
  }, [recipe]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newIngredientErrors: Record<number, Record<string, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Recipe name is required";
    }

    let hasIngredientErrors = false;
    formData.ingredients.forEach((ingredient, index) => {
      const ingredientError: Record<string, string> = {};

      if (!ingredient.raw_material_id) {
        ingredientError.raw_material_id = "Please select an ingredient";
        hasIngredientErrors = true;
      }

      if (ingredient.quantity <= 0) {
        ingredientError.quantity = "Quantity must be greater than 0";
        hasIngredientErrors = true;
      }

      if (!ingredient.baseUnit) {
        ingredientError.baseUnit = "Please select a unit";
        hasIngredientErrors = true;
      }

      if (Object.keys(ingredientError).length > 0) {
        newIngredientErrors[index] = ingredientError;
      }
    });

    if (formData.ingredients.length === 0) {
      newErrors.ingredients = "Please add at least one ingredient";
    }

    setErrors(newErrors);
    setIngredientErrors(newIngredientErrors);

    return Object.keys(newErrors).length === 0 && !hasIngredientErrors;
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

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: string | number | null) => {
    setFormData(prev => {
      const updatedIngredients = [...prev.ingredients];
      const currentIngredient = updatedIngredients[index] || {
        raw_material_id: 0,
        quantity: 0,
        baseUnit: ""
      };

      let processedValue: string | number;
      if (field === "raw_material_id" || field === "quantity") {
        // Handle numeric fields
        processedValue = typeof value === "number" ? value : field === "raw_material_id" ? parseInt(String(value)) || 0 : parseFloat(String(value)) || 0;
      } else {
        // Handle string fields
        processedValue = value === null ? "" : String(value);
      }

      updatedIngredients[index] = {
        ...currentIngredient,
        [field]: processedValue
      };

      return { ...prev, ingredients: updatedIngredients };
    });

    // Clear validation error
    if (ingredientErrors[index]?.[field]) {
      setIngredientErrors(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          [field]: ""
        }
      }));
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          raw_material_id: 0,
          quantity: 0,
          baseUnit: ""
        }
      ]
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => {
      const updatedIngredients = [...prev.ingredients];
      updatedIngredients.splice(index, 1);
      return { ...prev, ingredients: updatedIngredients };
    });

    setIngredientErrors(prev => {
      const updatedErrors = { ...prev };
      delete updatedErrors[index];
      const newErrors: Record<number, Record<string, string>> = {};
      Object.keys(updatedErrors).forEach(key => {
        const oldIndex = parseInt(key);
        if (oldIndex > index && updatedErrors[oldIndex]) {
          newErrors[oldIndex - 1] = updatedErrors[oldIndex];
        } else if (oldIndex < index && updatedErrors[oldIndex]) {
          newErrors[oldIndex] = updatedErrors[oldIndex];
        }
      });
      return newErrors;
    });
  };

  useEffect(() => {
    console.log("Raw materials data:", materials);
  }, [materials]);

  const getAvailableUnits = (rawMaterialId: number): string[] => {
    const material = materials.find(rm => rm.id === rawMaterialId);
    if (!material) return [];

    // Collect base units (like in your original code)
    const unitsSet = new Set<string>();
    if (material.unit) unitsSet.add(material.unit);
    if (material.baseUnit) unitsSet.add(material.baseUnit);

    // Add convertible units from the map for each unit found
    const unitsArray = Array.from(unitsSet);
    unitsArray.forEach(unit => {
      const convertibleUnits = unitConversionMap[unit];
      if (convertibleUnits) {
        convertibleUnits.forEach(cu => unitsSet.add(cu));
      }
    });

    return Array.from(unitsSet);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Recipe Name *</label>
          <Input type="text" value={formData.name} onValueChange={value => handleInputChange("name", value)} required />
          {errors.name && <p className="text-sm text-red-600 mt-1 dark:text-red-400">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Category</label>
          <Input type="text" value={formData.category || ""} onValueChange={value => handleInputChange("category", value)} placeholder="e.g., Appetizer, Main Course" />
        </div>
      </div>

      {/* Ingredients Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">Ingredients</h3>
          <Button type="button" size="sm" variant="outline" onClick={addIngredient}>
            <Plus className="h-4 w-4 mr-2" />
            Add Ingredient
          </Button>
        </div>

        {errors.ingredients && <p className="text-sm text-red-600 mb-4 dark:text-red-400">{errors.ingredients}</p>}

        {formData.ingredients.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-500 dark:text-gray-400">No ingredients added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-4 items-end">
                  {/* Ingredient Selection */}
                  <div className="min-w-0">
                    {" "}
                    {/* Added min-w-0 to prevent flex item overflow */}
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Ingredient *</label>
                    <Select
                      className="w-full"
                      value={ingredient.raw_material_id?.toString() || ""}
                      onChange={value => {
                        handleIngredientChange(index, "raw_material_id", value ? parseInt(value) : "0");
                        handleIngredientChange(index, "baseUnit", "");
                      }}
                      placeholder="Select ingredient"
                    >
                      {materials.map(material => (
                        <Select.Item key={material.id} value={material.id.toString()} disabled={formData.ingredients.some((ing, i) => ing.raw_material_id === material.id && i !== index)}>
                          {material.name}
                        </Select.Item>
                      ))}
                    </Select>
                    {ingredientErrors[index]?.raw_material_id && <p className="text-sm text-red-600 mt-1 dark:text-red-400">{ingredientErrors[index]?.raw_material_id}</p>}
                  </div>

                  {/* Quantity */}
                  <div className="w-auto min-w-[7rem]">
                    {" "}
                    {/* Changed to w-auto with min-width */}
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Quantity *</label>
                    <Input className="w-full" type="number" value={ingredient.quantity || ""} onValueChange={value => handleIngredientChange(index, "quantity", parseFloat(value) || 0)} min="0" step="0.01" />
                    {ingredientErrors[index]?.quantity && <p className="text-sm text-red-600 mt-1 dark:text-red-400">{ingredientErrors[index]?.quantity}</p>}
                  </div>

                  {/* Unit */}
                  <div className="w-auto min-w-[8rem]">
                    {" "}
                    {/* Changed to w-auto with min-width */}
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Unit *</label>
                    <Select className="w-full" value={ingredient.baseUnit} onChange={value => handleIngredientChange(index, "baseUnit", value)} placeholder="Select unit" disabled={!ingredient.raw_material_id}>
                      {ingredient.raw_material_id &&
                        getAvailableUnits(ingredient.raw_material_id).map(baseUnit => (
                          <Select.Item key={baseUnit} value={baseUnit}>
                            {baseUnit}
                          </Select.Item>
                        ))}
                    </Select>
                    {ingredientErrors[index]?.baseUnit && <p className="text-sm text-red-600 mt-1 dark:text-red-400">{ingredientErrors[index]?.baseUnit}</p>}
                  </div>

                  {/* Delete Button */}
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeIngredient(index)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Instructions</label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:opacity-50"
          value={formData.instructions || ""}
          onChange={e => handleInputChange("instructions", e.target.value)}
          rows={3}
          placeholder="Step-by-step cooking instructions"
        />
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

import type { ColumnDef } from "@tanstack/react-table";
import React, { useMemo, useState } from "react";
import { useRawMaterials } from "../../../hooks/useRawMaterials";
import { useCreateRecipe, useMenuEngineering, useRecipeCost, useRecipes, useUpdateRecipe } from "../../../hooks/useRecipes";
import { MenuCategoryLabels, type CreateRecipeRequest, type MenuCategory, type Recipe, type RecipeFilters } from "../../../types";
import type { MenuItemAnalysis } from "../../../types/recipes.types";
import { formatCurrency } from "../../../utils/quantity";
import { RecipeForm } from "../../forms/RecipeForm";
import { Button, Modal, Table } from "../../ui";

export const RecipesTab: React.FC = () => {
  const [filters, setFilters] = useState<RecipeFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [viewMode, setViewMode] = useState<"recipes" | "menu-engineering" | "costing">("recipes");

  const { data: recipesData, isLoading } = useRecipes(filters);
  const { data: menuEngineering } = useMenuEngineering(30);
  const { data: rawMaterialsData } = useRawMaterials({ category: "ALL", isActive: true, search: "" });
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();

  const recipes = recipesData?.recipes || [];
  const rawMaterials = rawMaterialsData?.materials || [];

  // Define table columns with proper TanStack Table ColumnDef types
  const recipeColumns = useMemo<ColumnDef<Recipe>[]>(
    () => [
      {
        id: "name",
        header: "Recipe Name",
        accessorKey: "name",
        size: 250,
        minSize: 200,
        maxSize: 400,
        enableSorting: true,
        cell: ({ row, getValue }) => {
          const name = getValue() as string;
          const description = row.original.description;
          return (
            <div className="min-w-0">
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate" title={name}>
                {name}
              </div>
              {description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={description}>
                  {description}
                </div>
              )}
            </div>
          );
        }
      },
      {
        id: "category",
        header: "Category",
        accessorKey: "category",
        size: 140,
        minSize: 120,
        maxSize: 180,
        enableSorting: true,
        meta: { align: "center" },
        cell: ({ getValue }) => {
          const category = getValue() as MenuCategory;
          return renderCategoryBadge(category);
        }
      },
      {
        id: "serving_size",
        header: "Servings",
        accessorKey: "serving_size",
        size: 100,
        minSize: 80,
        maxSize: 120,
        enableSorting: true,
        meta: { align: "center" },
        cell: ({ getValue }) => {
          const size = getValue() as number;
          return <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{size} portions</span>;
        }
      },
      {
        id: "prep_time",
        header: "Prep Time",
        accessorKey: "prep_time",
        size: 100,
        minSize: 80,
        maxSize: 120,
        enableSorting: true,
        meta: { align: "center" },
        cell: ({ getValue }) => {
          const time = getValue() as number;
          return <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{time} min</span>;
        }
      },
      {
        id: "ingredients",
        header: "Ingredients",
        accessorKey: "ingredients",
        size: 120,
        minSize: 100,
        maxSize: 150,
        enableSorting: false,
        meta: { align: "center" },
        cell: ({ getValue }) => {
          const ingredients = getValue() as unknown[];
          const count = ingredients?.length || 0;
          return (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {count} {count === 1 ? "item" : "items"}
            </span>
          );
        }
      },
      {
        id: "cost",
        header: "Recipe Cost",
        accessorKey: "id",
        size: 140,
        minSize: 120,
        maxSize: 180,
        enableSorting: false,
        meta: { align: "right" },
        cell: ({ getValue }) => {
          const id = getValue() as number;
          return <RecipeCostCell recipeId={id} />;
        }
      },
      {
        id: "actions",
        header: "Actions",
        accessorKey: "id",
        size: 140,
        minSize: 120,
        maxSize: 160,
        enableSorting: false,
        meta: { align: "center" },
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedRecipe(row.original);
                  setShowEditModal(true);
                }}
                className="text-xs"
              >
                Edit
              </Button>
              <Button size="sm" variant="ghost" className="text-xs">
                View
              </Button>
            </div>
          );
        }
      }
    ],
    []
  );

  const handleCreateRecipe = async (data: CreateRecipeRequest) => {
    try {
      await createRecipe.mutateAsync(data);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create recipe:", error);
    }
  };

  const handleUpdateRecipe = async (data: CreateRecipeRequest) => {
    if (!selectedRecipe) return;

    try {
      await updateRecipe.mutateAsync({ id: selectedRecipe.id, data });
      setShowEditModal(false);
      setSelectedRecipe(null);
    } catch (error) {
      console.error("Failed to update recipe:", error);
    }
  };

  const renderCategoryBadge = (category: MenuCategory) => {
    const label = MenuCategoryLabels[category] || category;
    const colors = {
      APPETIZER: "bg-orange-100 text-orange-800",
      MAIN_COURSE: "bg-blue-100 text-blue-800",
      DESSERT: "bg-pink-100 text-pink-800",
      BEVERAGE: "bg-green-100 text-green-800",
      SIDE_DISH: "bg-purple-100 text-purple-800",
      SAUCE: "bg-yellow-100 text-yellow-800"
    };

    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[category] || "bg-gray-100 text-gray-800"}`}>{label}</span>;
  };

  const renderRecipesView = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Recipes</h3>
          <p className="text-sm text-gray-500">Manage recipes and calculate ingredient costs</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode("menu-engineering")}>
            📊 Menu Engineering
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode("costing")}>
            💰 Recipe Costing
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            + Create Recipe
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">Category</label>
            <select value={filters.category || ""} onChange={e => setFilters({ ...filters, category: (e.target.value as MenuCategory) || undefined })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <option value="">All Categories</option>
              {Object.entries(MenuCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input type="text" value={filters.search || ""} onChange={e => setFilters({ ...filters, search: e.target.value || undefined })} placeholder="Search recipes..." className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => setFilters({})} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Recipes Table */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        ) : (
          <Table data={recipes} columns={recipeColumns} enableColumnResizing={true} enableSorting={true} maxHeight="600px" stickyHeader={true} emptyMessage="No recipes found. Create your first recipe to get started." />
        )}
      </div>
    </div>
  );

  const renderMenuEngineeringView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Menu Engineering Analysis</h3>
        <Button variant="outline" onClick={() => setViewMode("recipes")}>
          ← Back to Recipes
        </Button>
      </div>

      {menuEngineering && (
        <>
          {/* Boston Matrix */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-900">Menu Performance Matrix</h4>
              <p className="text-sm text-gray-500">Items categorized by popularity and profitability</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stars - High Popularity, High Profitability */}
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <h5 className="font-medium text-green-800">Stars ⭐</h5>
                    <span className="ml-2 text-sm text-green-600">({menuEngineering.matrix.stars.length})</span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">High popularity, high profitability</p>
                  <div className="space-y-2">
                    {menuEngineering.matrix.stars.slice(0, 3).map((item: MenuItemAnalysis) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-green-800">{item.name}</span>
                        <span className="text-green-600">{formatCurrency(item.marginAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plowhorses - High Popularity, Low Profitability */}
                <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-center mb-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <h5 className="font-medium text-yellow-800">Plowhorses 🐎</h5>
                    <span className="ml-2 text-sm text-yellow-600">({menuEngineering.matrix.plowhorses.length})</span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">High popularity, low profitability</p>
                  <div className="space-y-2">
                    {menuEngineering.matrix.plowhorses.slice(0, 3).map((item: MenuItemAnalysis) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-yellow-800">{item.name}</span>
                        <span className="text-yellow-600">{formatCurrency(item.marginAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Puzzles - Low Popularity, High Profitability */}
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center mb-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <h5 className="font-medium text-blue-800">Puzzles 🧩</h5>
                    <span className="ml-2 text-sm text-blue-600">({menuEngineering.matrix.puzzles.length})</span>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">Low popularity, high profitability</p>
                  <div className="space-y-2">
                    {menuEngineering.matrix.puzzles.slice(0, 3).map((item: MenuItemAnalysis) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-blue-800">{item.name}</span>
                        <span className="text-blue-600">{formatCurrency(item.marginAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dogs - Low Popularity, Low Profitability */}
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <h5 className="font-medium text-red-800">Dogs 🐕</h5>
                    <span className="ml-2 text-sm text-red-600">({menuEngineering.matrix.dogs.length})</span>
                  </div>
                  <p className="text-sm text-red-700 mb-3">Low popularity, low profitability</p>
                  <div className="space-y-2">
                    {menuEngineering.matrix.dogs.slice(0, 3).map((item: MenuItemAnalysis) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-red-800">{item.name}</span>
                        <span className="text-red-600">{formatCurrency(item.marginAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Recommendations */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-900">Recommendations</h4>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {menuEngineering.summary.recommendations.map((rec, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">{rec.category}</h5>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rec.priority === "HIGH" ? "bg-red-100 text-red-800" : rec.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>{rec.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderCostingView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Recipe Costing Analysis</h3>
        <Button variant="outline" onClick={() => setViewMode("recipes")}>
          ← Back to Recipes
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Recipe Cost Analysis</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Analyze the cost breakdown of each recipe including ingredient costs, labor, and overhead to determine optimal pricing strategies.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Cost Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.slice(0, 6).map(recipe => (
          <RecipeCostCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case "menu-engineering":
        return renderMenuEngineeringView();
      case "costing":
        return renderCostingView();
      default:
        return renderRecipesView();
    }
  };

  return (
    <>
      {renderContent()}

      {/* Create Recipe Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Recipe" size="lg">
        <div className="p-6">
          <RecipeForm onSubmit={handleCreateRecipe} onCancel={() => setShowCreateModal(false)} isLoading={createRecipe.isPending} rawMaterials={rawMaterials} />
        </div>
      </Modal>

      {/* Edit Recipe Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRecipe(null);
        }}
        title={`Edit ${selectedRecipe?.name}`}
        size="large"
      >
        <div className="p-6">
          <RecipeForm
            recipe={selectedRecipe}
            onSubmit={handleUpdateRecipe}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedRecipe(null);
            }}
            isLoading={updateRecipe.isPending}
            rawMaterials={rawMaterials}
          />
        </div>
      </Modal>
    </>
  );
};

// Helper Components
const RecipeCostCell: React.FC<{ recipeId: number }> = ({ recipeId }) => {
  const { data: costData, isLoading } = useRecipeCost(recipeId);

  if (isLoading) {
    return <div className="animate-pulse w-16 h-4 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="text-sm">
      <div className="font-medium text-gray-900">{formatCurrency(costData?.totalCost || 0)}</div>
      <div className="text-gray-500">per serving</div>
    </div>
  );
};

const RecipeCostCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const { data: costData } = useRecipeCost(recipe.id);

  const renderCategoryBadge = (category: MenuCategory) => {
    const label = MenuCategoryLabels[category] || category;
    const colors = {
      APPETIZER: "bg-orange-100 text-orange-800",
      MAIN_COURSE: "bg-blue-100 text-blue-800",
      DESSERT: "bg-pink-100 text-pink-800",
      BEVERAGE: "bg-green-100 text-green-800",
      SIDE_DISH: "bg-purple-100 text-purple-800",
      SAUCE: "bg-yellow-100 text-yellow-800"
    };

    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"}`}>{label}</span>;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-gray-900">{recipe.name}</h4>
        {renderCategoryBadge(recipe.category)}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Total Cost</span>
          <span className="text-sm font-medium text-gray-900">{formatCurrency(costData?.totalCost || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Cost per Serving</span>
          <span className="text-sm font-medium text-gray-900">{formatCurrency((costData?.totalCost || 0) / recipe.serving_size)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Ingredients</span>
          <span className="text-sm font-medium text-gray-900">{recipe.ingredients?.length || 0} items</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Prep Time</span>
          <span className="text-sm font-medium text-gray-900">{recipe.prep_time} min</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <Button size="sm" variant="outline" className="w-full">
          View Cost Breakdown
        </Button>
      </div>
    </div>
  );
};

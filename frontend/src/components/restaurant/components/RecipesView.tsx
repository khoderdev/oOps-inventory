import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useDeleteRecipe, useRecipes } from "../../../hooks/useRecipes";
import { MenuCategoryLabels, type MenuCategory, type Recipe, type RecipeFilters } from "../../../types";
import { Button, Table } from "../../ui";
import { CategoryBadge } from "./CategoryBadge";
import { RecipeCostCell } from "./RecipeCostCell";

export const RecipesView: React.FC<{ onOpenCreate: () => void; onOpenEdit: (recipe: Recipe) => void; onOpenView: (recipe: Recipe) => void; onSwitchView: (view: "menu-engineering" | "costing") => void }> = ({ onOpenCreate, onOpenEdit, onOpenView, onSwitchView }) => {
  const [filters, setFilters] = useState<RecipeFilters>({
    search: "",
    category: undefined,
    is_active: undefined,
    page: 1,
    limit: 20
  });

  const { data: recipesData, isLoading } = useRecipes(filters);
  const deleteRecipe = useDeleteRecipe();
  const recipes = recipesData?.recipes || [];

  const handleDeleteRecipe = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this recipe?");
    if (!confirmed) return;
    try {
      await deleteRecipe.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete recipe:", error);
    }
  };

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
          const instruction = row.original.instructions;
          return (
            <div className="min-w-0">
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate" title={name}>
                {name}
              </div>
              {instruction && (
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={instruction}>
                  {instruction}
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
        enableSorting: true,
        meta: { align: "center" },
        cell: ({ getValue }) => {
          const category = getValue() as MenuCategory;
          return <CategoryBadge category={category} />;
        }
      },
      {
        id: "ingredients",
        header: "Ingredients",
        accessorKey: "ingredients",
        size: 120,
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
        size: 160,
        enableSorting: false,
        meta: { align: "center" },
        cell: ({ row }) => (
          <div className="flex items-center justify-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => onOpenEdit(row.original)} className="text-xs">
              Edit
            </Button>
            <Button size="sm" variant="secondary" className="text-xs" onClick={() => handleDeleteRecipe(row.original.id)}>
              Delete
            </Button>
          </div>
        )
      }
    ],
    [onOpenEdit]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recipes</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage recipes and calculate ingredient costs</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onSwitchView("costing")}>
            💰 Recipe Costing
          </Button>
          <Button onClick={onOpenCreate} size="sm">
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
            <input type="text" value={filters.search || ""} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Search recipes..." className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400" />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => setFilters({ category: undefined, search: "" })} className="w-full">
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
          <Table data={recipes} columns={recipeColumns} enableColumnResizing enableSorting maxHeight="600px" stickyHeader emptyMessage="No recipes found. Create your first recipe to get started." onRowClick={onOpenView} />
        )}
      </div>
    </div>
  );
};

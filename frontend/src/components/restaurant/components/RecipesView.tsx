// // import type { ColumnDef } from "@tanstack/react-table";
// // import { useMemo, useState } from "react";
// // import { useDeleteRecipe, useRecipes } from "../../../hooks/useRecipes";
// // import { MenuCategoryLabels, type MenuCategory, type Recipe, type RecipeFilters } from "../../../types";
// // import { Button, Table } from "../../ui";
// // import { DataImporterExporter } from "../../ui/DataImporterExporter";
// // import { CategoryBadge } from "./CategoryBadge";
// // import { RecipeCostCell } from "./RecipeCostCell";

// // export const RecipesView: React.FC<{ onOpenCreate: () => void; onOpenEdit: (recipe: Recipe) => void; onOpenView: (recipe: Recipe) => void; onSwitchView: (view: "recipes" | "costing") => void }> = ({ onOpenCreate, onOpenEdit, onOpenView, onSwitchView }) => {
// //   const [filters, setFilters] = useState<RecipeFilters>({
// //     search: "",
// //     category: undefined,
// //     is_active: undefined,
// //     page: 1,
// //     limit: 20
// //   });

// //   const { data: recipesData, isLoading } = useRecipes(filters);
// //   const deleteRecipe = useDeleteRecipe();
// //   const recipes = recipesData?.recipes || [];

// //   const handleDeleteRecipe = async (id: number) => {
// //     const confirmed = window.confirm("Are you sure you want to delete this recipe?");
// //     if (!confirmed) return;
// //     try {
// //       await deleteRecipe.mutateAsync(id);
// //     } catch (error) {
// //       console.error("Failed to delete recipe:", error);
// //     }
// //   };

// //   const recipeColumns = useMemo<ColumnDef<Recipe>[]>(
// //     () => [
// //       {
// //         id: "name",
// //         header: "Recipe Name",
// //         accessorKey: "name",
// //         size: 250,
// //         minSize: 200,
// //         maxSize: 400,
// //         enableSorting: true,
// //         cell: ({ row, getValue }) => {
// //           const name = getValue() as string;
// //           const instruction = row.original.instructions;
// //           return (
// //             <div className="min-w-0">
// //               <div className="font-medium text-gray-900 dark:text-gray-100 truncate" title={name}>
// //                 {name}
// //               </div>
// //               {instruction && (
// //                 <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={instruction}>
// //                   {instruction}
// //                 </div>
// //               )}
// //             </div>
// //           );
// //         }
// //       },
// //       {
// //         id: "category",
// //         header: "Category",
// //         accessorKey: "category",
// //         size: 140,
// //         enableSorting: true,
// //         meta: { align: "center" },
// //         cell: ({ getValue }) => {
// //           const category = getValue() as MenuCategory;
// //           return <CategoryBadge category={category} />;
// //         }
// //       },
// //       {
// //         id: "ingredients",
// //         header: "Ingredients",
// //         accessorKey: "ingredients",
// //         size: 120,
// //         enableSorting: false,
// //         meta: { align: "center" },
// //         cell: ({ getValue }) => {
// //           const ingredients = getValue() as unknown[];
// //           const count = ingredients?.length || 0;
// //           return (
// //             <span className="text-sm text-gray-600 dark:text-gray-400">
// //               {count} {count === 1 ? "item" : "items"}
// //             </span>
// //           );
// //         }
// //       },
// //       {
// //         id: "cost",
// //         header: "Recipe Cost",
// //         accessorKey: "id",
// //         size: 140,
// //         enableSorting: false,
// //         meta: { align: "right" },
// //         cell: ({ row }) => {
// //           return <RecipeCostCell recipe={row.original} />;
// //         }
// //       },
// //       {
// //         id: "actions",
// //         header: "Actions",
// //         accessorKey: "id",
// //         size: 160,
// //         enableSorting: false,
// //         meta: { align: "center" },
// //         cell: ({ row }) => (
// //           <div className="flex items-center justify-center space-x-2">
// //             <Button size="sm" variant="outline" onClick={() => onOpenEdit(row.original)} className="text-xs">
// //               Edit
// //             </Button>
// //             <Button size="sm" variant="secondary" className="text-xs" onClick={() => handleDeleteRecipe(row.original.id)}>
// //               Delete
// //             </Button>
// //           </div>
// //         )
// //       }
// //     ],
// //     [onOpenEdit]
// //   );

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
// //         <div>
// //           <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recipes</h3>
// //           <p className="text-sm text-gray-500 dark:text-gray-400">Manage recipes and calculate ingredient costs</p>
// //         </div>
// //         <div className="flex flex-wrap gap-2">
// //           <Button
// //             variant="outline"
// //             size="sm"
// //             onClick={() => {
// //               console.log("Switching to costing");
// //               onSwitchView("costing");
// //             }}
// //           >
// //             💰 Recipe Costing
// //           </Button>
// //           <Button onClick={onOpenCreate} size="sm">
// //             + Create Recipe
// //           </Button>
// //         </div>
// //       </div>

// //       <div className="bg-white p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
// //         <DataImporterExporter initialData={recipes} />
// //       </div>

// //       {/* Filters */}
// //       <div className="bg-white p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
// //         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //           <div>
// //             <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">Category</label>
// //             <select value={filters.category || ""} onChange={e => setFilters({ ...filters, category: (e.target.value as MenuCategory) || undefined })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
// //               <option value="">All Categories</option>
// //               {Object.entries(MenuCategoryLabels).map(([value, label]) => (
// //                 <option key={value} value={value}>
// //                   {label}
// //                 </option>
// //               ))}
// //             </select>
// //           </div>
// //           <div>
// //             <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
// //             <input type="text" value={filters.search || ""} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Search recipes..." className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400" />
// //           </div>
// //           <div className="flex items-end">
// //             <Button variant="outline" onClick={() => setFilters({ category: undefined, search: "" })} className="w-full">
// //               Clear Filters
// //             </Button>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Recipes Table */}
// //       <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
// //         {isLoading ? (
// //           <div className="flex items-center justify-center h-64">
// //             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
// //           </div>
// //         ) : (
// //           <Table data={recipes} columns={recipeColumns} enableColumnResizing enableSorting maxHeight="600px" stickyHeader emptyMessage="No recipes found. Create your first recipe to get started." onRowClick={onOpenView} />
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// /////////////////////////////////////////////////////////////////////

// // import type { ColumnDef } from "@tanstack/react-table";
// // import { useMemo, useState } from "react";
// // import { useDeleteRecipe, useRecipes } from "../../../hooks/useRecipes";
// // import { MenuCategoryLabels, type MenuCategory, type Recipe, type RecipeFilters } from "../../../types";
// // import { Button, Input, Select, Table } from "../../ui";
// // import { DataImporterExporter } from "../../ui/DataImporterExporter";
// // import { CategoryBadge } from "./CategoryBadge";
// // import { RecipeCostCell } from "./RecipeCostCell";

// // export const RecipesView = ({ onOpenCreate, onOpenEdit, onOpenView, onSwitchView }: { onOpenCreate: () => void; onOpenEdit: (recipe: Recipe) => void; onOpenView: (recipe: Recipe) => void; onSwitchView: (view: "recipes" | "costing") => void }) => {
// //   const [filters, setFilters] = useState<RecipeFilters>({
// //     search: "",
// //     category: undefined,
// //     is_active: undefined,
// //     page: 1,
// //     limit: 20
// //   });

// //   const { data: recipesData, isLoading } = useRecipes(filters);
// //   const deleteRecipe = useDeleteRecipe();
// //   const recipes = recipesData?.recipes || [];

// //   const handleDeleteRecipe = async (id: number) => {
// //     if (!window.confirm("Are you sure you want to delete this recipe?")) return;
// //     try {
// //       await deleteRecipe.mutateAsync(id);

// //     } catch (error) {
// //       console.error("Failed to delete recipe:", error);
// //     }
// //   };

// import type { ColumnDef } from "@tanstack/react-table";
// import { useMemo, useState } from "react";
// import { useDeleteRecipe, useRecipes } from "../../../hooks/useRecipes";
// import { MenuCategoryLabels, type MenuCategory, type Recipe, type RecipeFilters } from "../../../types";
// import { Button, Input, Select, Table } from "../../ui";
// import { DataImporterExporter } from "../../ui/DataImporterExporter";
// import { CategoryBadge } from "./CategoryBadge";
// import { RecipeCostCell } from "./RecipeCostCell";

// export const RecipesView = ({ onOpenCreate, onOpenEdit, onOpenView, onSwitchView }: { onOpenCreate: () => void; onOpenEdit: (recipe: Recipe) => void; onOpenView: (recipe: Recipe) => void; onSwitchView: (view: "recipes" | "costing") => void }) => {
//   const [filters, setFilters] = useState<RecipeFilters>({
//     search: "",
//     category: undefined,
//     is_active: undefined,
//     page: 1,
//     limit: 20
//   });

//   // State to track any open modals
//   const [openModalId, setOpenModalId] = useState<number | null>(null);

//   const { data: recipesData, isLoading } = useRecipes(filters);
//   const deleteRecipe = useDeleteRecipe();
//   const recipes = recipesData?.recipes || [];

//   const handleDeleteRecipe = async (id: number) => {
//     if (!window.confirm("Are you sure you want to delete this recipe?")) return;
//     try {
//       await deleteRecipe.mutateAsync(id, {
//         onSuccess: () => {
//           // Close any open modal when delete is successful
//           setOpenModalId(null);
//         }
//       });
//     } catch (error) {
//       console.error("Failed to delete recipe:", error);
//     }
//   };

//   const recipeColumns = useMemo<ColumnDef<Recipe>[]>(
//     () => [
//       {
//         id: "name",
//         header: "Recipe Name",
//         accessorKey: "name",
//         size: 250,
//         cell: ({ row, getValue }) => {
//           const name = getValue() as string;
//           return (
//             <div className="min-w-0">
//               <div className="font-medium text-gray-900 dark:text-gray-100 truncate hover:text-blue-600 cursor-pointer" onClick={() => onOpenView(row.original)}>
//                 {name}
//               </div>
//               {row.original.instructions && <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{row.original.instructions.substring(0, 60)}...</div>}
//             </div>
//           );
//         }
//       },
//       {
//         id: "category",
//         header: "Category",
//         accessorKey: "category",
//         size: 140,
//         cell: ({ getValue }) => <CategoryBadge category={getValue() as MenuCategory} />
//       },
//       {
//         id: "ingredients",
//         header: "Ingredients",
//         accessorKey: "ingredients",
//         size: 120,
//         cell: ({ getValue }) => {
//           const count = (getValue() as unknown[])?.length || 0;
//           return `${count} ${count === 1 ? "item" : "items"}`;
//         }
//       },
//       {
//         id: "cost",
//         header: "Cost",
//         accessorKey: "id",
//         size: 100,
//         cell: ({ row }) => <RecipeCostCell recipe={row.original} />
//       },
//       {
//         id: "actions",
//         header: "",
//         accessorKey: "id",
//         size: 120,
//         cell: ({ row }) => (
//           <div className="flex gap-2">
//             <Button
//               size="sm"
//               variant="outline"
//               onClick={() => {
//                 setOpenModalId(row.original.id);
//                 onOpenEdit(row.original);
//               }}
//             >
//               Edit
//             </Button>
//             <Button size="sm" variant="destructive" onClick={() => handleDeleteRecipe(row.original.id)}>
//               Delete
//             </Button>
//           </div>
//         )
//       }
//     ],
//     [onOpenEdit, onOpenView]
//   );

//   return (
//     <div className="space-y-4">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row justify-between gap-4">
//         <div>
//           <h2 className="text-xl font-semibold">Recipes</h2>
//           <p className="text-sm text-muted-foreground">Manage your recipes</p>
//         </div>
//         <div className="flex gap-2">
//           <Button variant="outline" onClick={() => onSwitchView("costing")}>
//             Recipe Costing
//           </Button>
//           <Button onClick={onOpenCreate}>Create Recipe</Button>
//         </div>
//       </div>

//       {/* Data Tools */}
//       <DataImporterExporter initialData={recipes} className="border p-4 rounded-lg" />

//       {/* Filters */}
//       <div className="border p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div>
//           <label className="block text-sm mb-1">Category</label>
//           <Select
//             value={filters.category || ""}
//             onChange={value => setFilters({ ...filters, category: (value as MenuCategory) || undefined })}
//             options={[
//               { value: "", label: "All Categories" },
//               ...Object.entries(MenuCategoryLabels).map(([value, label]) => ({
//                 value,
//                 label
//               }))
//             ]}
//           />
//         </div>
//         <div>
//           <label className="block text-sm mb-1">Search</label>
//           <Input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Search recipes..." />
//         </div>
//         <div className="flex items-end">
//           <Button variant="outline" onClick={() => setFilters({ ...filters, category: undefined, search: "" })} className="w-full">
//             Clear
//           </Button>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="border rounded-lg overflow-hidden">
//         {isLoading ? (
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
//           </div>
//         ) : (
//           <Table data={recipes} columns={recipeColumns} onRowClick={onOpenView} emptyMessage="No recipes found" />
//         )}
//       </div>
//     </div>
//   );
// };
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useDeleteRecipe, useRecipes } from "../../../hooks/useRecipes";
import { MenuCategoryLabels, type MenuCategory, type Recipe, type RecipeFilters } from "../../../types";
import { Button, Table } from "../../ui";
import { CategoryBadge } from "./CategoryBadge";
import { RecipeCostCell } from "./RecipeCostCell";

export const RecipesView: React.FC<{ onOpenCreate: () => void; onOpenEdit: (recipe: Recipe) => void; onOpenView: (recipe: Recipe) => void; onSwitchView: (view: "recipes" | "costing") => void }> = ({ onOpenCreate, onOpenEdit, onOpenView, onSwitchView }) => {
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
        cell: ({ row }) => {
          return <RecipeCostCell recipe={row.original} />;
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
  // Filter recipes locally based on search term
  const filteredRecipes = useMemo(() => {
    if (!filters.search) return recipes;

    const searchTerm = filters.search.toLowerCase();

    return recipes.filter(recipe => recipe.name?.toLowerCase().includes(searchTerm) || recipe.instructions?.toLowerCase().includes(searchTerm));
  }, [recipes, filters.search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recipes</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage recipes and calculate ingredient costs</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("Switching to costing");
              onSwitchView("costing");
            }}
          >
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
          <Table data={filteredRecipes} columns={recipeColumns} enableColumnResizing enableSorting maxHeight="600px" stickyHeader emptyMessage="No recipes found. Create your first recipe to get started." onRowClick={onOpenView} />
        )}
      </div>
    </div>
  );
};

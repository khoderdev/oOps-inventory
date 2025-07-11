import { History, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { Button, Modal, Table } from "../../components/ui";
import { useSectionRecipesConsumption } from "../../hooks/useSections";
import type { RecipeIngredient } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatting";

interface SectionConsumptionsProps {
  sectionId: string;
  sectionName: string;
}

export const SectionRecipesConsumptionHistory: React.FC<SectionConsumptionsProps> = ({ sectionId, sectionName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: consumptions = [], isLoading, error } = useSectionRecipesConsumption(sectionId);

  const tableData = consumptions.map(item => ({
    id: item.id,
    recipeName: item.recipe?.name || "Unknown Recipe",
    recipeCategory: item.recipe?.category || "",
    date: item.consumedDate,
    quantity: 1,
    unit: "serving",
    cost: calculateTotalCost(item.ingredients),
    reason: item.reason,
    orderId: item.orderId,
    consumedBy: item.user?.name || "Unknown",
    ingredients: item.ingredients || []
  }));

  const totalConsumption = tableData.reduce((sum, item) => sum + (item.cost || 0), 0);

  function calculateTotalCost(ingredients: RecipeIngredient[]) {
    return (
      ingredients?.reduce((sum, ing) => {
        const quantity = parseFloat(String(ing.quantity)) || 0;
        const costPerUnit = parseFloat(String(ing.cost_per_unit)) || 0;
        return sum + quantity * costPerUnit;
      }, 0) || 0
    );
  }

  const columns = [
    {
      header: "Recipe",
      accessorKey: "recipeName",
      cell: ({ getValue, row }: any) => (
        <div>
          <span className="font-medium">{getValue()}</span>
          {row.original.recipeCategory && <span className="block text-xs text-muted-foreground capitalize">{row.original.recipeCategory}</span>}
        </div>
      )
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ getValue }: any) => formatDate(getValue())
    },
    {
      header: "Order",
      accessorKey: "orderId",
      cell: ({ getValue }: any) => <span className="font-mono text-sm">{getValue() || "N/A"}</span>
    },
    {
      header: "Prepared By",
      accessorKey: "consumedBy",
      cell: ({ getValue }: any) => <span className="text-sm">{getValue()}</span>
    },
    {
      header: "Cost",
      accessorKey: "cost",
      cell: ({ getValue }: any) => formatCurrency(getValue()),
      meta: { align: "right" }
    },
    {
      header: "Details",
      accessorKey: "id",
      cell: ({ row }: any) => (
        <button className="text-sm text-blue-600 hover:underline" onClick={() => console.log("Show details for", row.original)}>
          View
        </button>
      )
    }
  ];

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} size="sm" leftIcon={<History className="w-4 h-4" />} variant="outline">
        History
      </Button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Recipes Consumption History - ${sectionName}`} size="lg">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 rounded bg-red-50 dark:bg-red-900/20">Failed to load consumption data</div>
          ) : tableData.length === 0 ? (
            <div className="text-gray-500 p-4 text-center">No consumption records found.</div>
          ) : (
            <>
              <Table data={tableData} columns={columns} emptyMessage="No consumption records" className="border rounded-lg" />
              <div className="flex justify-end pt-4 border-t">
                <div className="text-lg font-medium">Total: {formatCurrency(totalConsumption)}</div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

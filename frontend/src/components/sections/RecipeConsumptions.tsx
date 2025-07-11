import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Loader2 } from "lucide-react";
import React from "react";
import { useSectionRecipesConsumption } from "../../hooks/useSections";
import { formatCurrency, formatDate } from "../../utils/formatting";

interface RawMaterial {
  id: number;
  name: string;
  unit: string;
}

interface Ingredient {
  rawMaterial: RawMaterial;
  quantity: string;
  unit: string;
  baseUnit?: string;
  costPerUnit: string;
}

interface RecipeConsumption {
  id: number;
  recipe: {
    id: number;
    name: string;
    category: string;
  };
  consumedBy: {
    id: number;
    username: string;
    name?: string;
  };
  consumedDate: string;
  ingredients: Ingredient[];
  orderId?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  sectionId: string;
}

const calculateTotalCost = (ingredients: Ingredient[]): number => {
  return ingredients.reduce((sum, ing) => {
    const quantity = parseFloat(ing.quantity) || 0;
    const costPerUnit = parseFloat(ing.costPerUnit) || 0;
    return sum + quantity * costPerUnit;
  }, 0);
};

export const SectionRecipesConsumptionContent: React.FC<Props> = ({ sectionId }) => {
  const { data: apiResponse, isLoading, error } = useSectionRecipesConsumption(sectionId);

  // Handle case where data might not be in the expected format
  const consumptions = React.useMemo(() => {
    if (!apiResponse) return [];
    if (Array.isArray(apiResponse)) return apiResponse; // Fallback if no success wrapper
    return apiResponse.success ? apiResponse.data : [];
  }, [apiResponse]);

  const tableData = React.useMemo(
    () =>
      consumptions.map((item: RecipeConsumption) => ({
        id: item.id.toString(),
        recipeName: item.recipe?.name || "Unknown Recipe",
        recipeCategory: item.recipe?.category || "",
        date: item.consumedDate,
        cost: calculateTotalCost(item.ingredients || []),
        reason: item.reason,
        orderId: item.orderId,
        consumedBy: item.consumedBy?.username || "Unknown", // Using username since name might not exist
        ingredients: (item.ingredients || []).map(ing => ({
          id: ing.rawMaterial?.id.toString() || Math.random().toString(),
          name: ing.rawMaterial?.name || "Unknown",
          quantity: ing.quantity,
          unit: ing.unit,
          cost_per_unit: ing.costPerUnit,
          baseUnit: ing.baseUnit
        }))
      })),
    [consumptions]
  );

  const totalConsumption = React.useMemo(() => tableData.reduce((sum, item) => sum + item.cost, 0), [tableData]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8" aria-live="polite" aria-busy="true">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded bg-red-50 dark:bg-red-900/20" role="alert">
        Failed to load consumption data
      </div>
    );
  }

  if (tableData.length === 0) {
    return (
      <div className="text-gray-500 p-4 text-center dark:text-gray-400 border rounded-lg" aria-live="polite">
        No consumption records found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion.Root type="multiple" className="w-full border rounded-lg divide-y dark:divide-gray-700 dark:border-gray-400" aria-label="Recipe consumption records">
        {tableData.map(item => (
          <Accordion.Item key={item.id} value={item.id} className="group px-4 py-3 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-colors dark:focus-within:ring-gray-400">
            <Accordion.Header>
              <Accordion.Trigger className="flex justify-between items-center w-full text-left font-medium hover:bg-gray-100 dark:hover:bg-gray-800 py-2 transition rounded-md focus:outline-none">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{item.recipeName}</div>
                  <div className="text-xs text-muted-foreground capitalize truncate">{item.recipeCategory}</div>
                </div>
                <div className="flex items-center gap-4 pl-4">
                  <span className="text-sm tabular-nums">{formatCurrency(item.cost)}</span>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0 dark:text-gray-400" aria-hidden />
                </div>
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content className="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp dark:bg-gray-800">
              <div className="pt-3 pb-2 text-sm text-gray-700 dark:text-gray-300 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Date</div>
                    <div>{formatDate(item.date)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Order</div>
                    <div className="font-mono">{item.orderId || "N/A"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Prepared By</div>
                    <div>{item.consumedBy}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Cost</div>
                    <div>{formatCurrency(item.cost)}</div>
                  </div>
                  {item.reason && (
                    <div className="md:col-span-2 space-y-1">
                      <div className="text-xs text-muted-foreground">Reason</div>
                      <div className="capitalize">{item.reason.replace(/_/g, " ")}</div>
                    </div>
                  )}
                </div>

                {item.ingredients.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Ingredients</div>
                    <ul className="space-y-2">
                      {item.ingredients.map(ing => (
                        <li key={ing.id} className="flex justify-between">
                          <span>
                            {ing.name} — {ing.quantity} {ing.unit}
                            {ing.baseUnit && ing.baseUnit !== ing.unit && <span className="text-xs text-muted-foreground ml-1">({ing.baseUnit})</span>}
                          </span>
                          <span className="tabular-nums">
                            @ {formatCurrency(parseFloat(ing.cost_per_unit))} = <strong>{formatCurrency(parseFloat(ing.quantity) * parseFloat(ing.cost_per_unit))}</strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      <div className="flex justify-end pt-4 border-t dark:border-gray-400">
        <div className="text-lg font-medium tabular-nums">Total: {formatCurrency(totalConsumption)}</div>
      </div>
    </div>
  );
};

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

interface GroupedRecipeConsumption {
  recipeId: number;
  recipeName: string;
  recipeCategory: string;
  totalCost: number;
  usageCount: number;
  consumptions: {
    id: number;
    date: string;
    cost: number;
    reason?: string;
    orderId?: string;
    consumedBy: string;
    ingredients: {
      id: string;
      name: string;
      quantity: string;
      unit: string;
      cost_per_unit: string;
      baseUnit?: string;
    }[];
  }[];
}

export const SectionRecipesConsumptionContent: React.FC<Props> = ({ sectionId }) => {
  const { data: apiResponse, isLoading, error } = useSectionRecipesConsumption(sectionId);

  // Handle case where data might not be in the expected format
  const consumptions = React.useMemo(() => {
    if (!apiResponse) return [];
    if (Array.isArray(apiResponse)) return apiResponse; // Fallback if no success wrapper
    return apiResponse.success ? apiResponse.data : [];
  }, [apiResponse]);

  // Group consumptions by recipe and calculate usage counts
  const groupedData = React.useMemo(() => {
    const recipeGroups = new Map<number, GroupedRecipeConsumption>();

    consumptions.forEach((item: RecipeConsumption) => {
      const recipeId = item.recipe?.id;
      if (!recipeId) return;

      const cost = calculateTotalCost(item.ingredients || []);
      const consumptionEntry = {
        id: item.id,
        date: item.consumedDate,
        cost,
        reason: item.reason,
        orderId: item.orderId,
        consumedBy: item.consumedBy?.username || "Unknown",
        ingredients: (item.ingredients || []).map(ing => ({
          id: ing.rawMaterial?.id.toString() || Math.random().toString(),
          name: ing.rawMaterial?.name || "Unknown",
          quantity: ing.quantity,
          unit: ing.unit,
          cost_per_unit: ing.costPerUnit,
          baseUnit: ing.baseUnit
        }))
      };

      if (recipeGroups.has(recipeId)) {
        const existing = recipeGroups.get(recipeId)!;
        existing.totalCost += cost;
        existing.usageCount += 1;
        existing.consumptions.push(consumptionEntry);
      } else {
        recipeGroups.set(recipeId, {
          recipeId,
          recipeName: item.recipe?.name || "Unknown Recipe",
          recipeCategory: item.recipe?.category || "",
          totalCost: cost,
          usageCount: 1,
          consumptions: [consumptionEntry]
        });
      }
    });

    // Sort recipes by most used first, then by name
    return Array.from(recipeGroups.values()).sort((a, b) => {
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return a.recipeName.localeCompare(b.recipeName);
    });
  }, [consumptions]);

  const totalConsumption = React.useMemo(() => groupedData.reduce((sum, group) => sum + group.totalCost, 0), [groupedData]);

  const Detail = ({ label, value, isMono = false }: { label: string; value: React.ReactNode; isMono?: boolean }) => (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={isMono ? "font-mono" : ""}>{value}</div>
    </div>
  );

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

  if (groupedData.length === 0) {
    return (
      <div className="text-gray-500 p-4 text-center dark:text-gray-400 border rounded-lg" aria-live="polite">
        No consumption records found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion.Root type="multiple" className="w-full divide-y rounded-lg border border-gray-200 dark:border-gray-600 dark:divide-gray-700" aria-label="Recipe consumption records">
        {groupedData.map(group => (
          <Accordion.Item key={group.recipeId} value={group.recipeId.toString()} className="group px-4 py-3 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 dark:focus-within:ring-gray-500">
            <Accordion.Header>
              <Accordion.Trigger className="flex justify-between items-center w-full text-left gap-4 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md transition">
                <div className="flex flex-col flex-1 truncate">
                  <span className="text-base font-semibold truncate text-ellipsis dark:text-white">{group.recipeName}</span>
                  <span className="text-xs text-muted-foreground capitalize truncate dark:text-gray-400">{group.recipeCategory}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-mono tabular-nums text-gray-700 dark:text-gray-200">{formatCurrency(group.totalCost)}</span>
                    <span className="text-xs text-muted-foreground dark:text-gray-400">{group.usageCount === 1 ? "Sold 1 time" : `Sold ${group.usageCount} times`}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180 dark:text-gray-400" />
                </div>
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content className="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp dark:bg-gray-900 bg-gray-50 rounded-b-lg">
              <div className="p-4 text-sm text-gray-800 dark:text-gray-300 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg dark:bg-blue-900/20">
                    <Detail label="Total Orders" value={group.usageCount === 1 ? "1 order" : `${group.usageCount} orders`} />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg dark:bg-blue-900/20">
                    <Detail label="Total Revenue" value={formatCurrency(group.totalCost)} isMono />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg dark:bg-blue-900/20">
                    <Detail label="Average per Order" value={formatCurrency(group.totalCost / group.usageCount)} isMono />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Order History</h4>
                  <div className="space-y-3">
                    {group.consumptions.map(consumption => (
                      <div key={consumption.id} className="p-3 border rounded-lg dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Detail label="Date" value={formatDate(consumption.date)} />
                          <Detail label="Order #" value={consumption.orderId || "N/A"} isMono />
                          <Detail label="Prepared By" value={consumption.consumedBy} />
                          <Detail label="Order Total" value={formatCurrency(consumption.cost)} isMono />
                          {consumption.reason && (
                            <div className="md:col-span-2">
                              <Detail label="Notes" value={consumption.reason.replace(/_/g, " ").toLowerCase()} />
                            </div>
                          )}
                        </div>

                        {consumption.ingredients.length > 0 && (
                          <div className="pt-3 mt-3 border-t dark:border-gray-700">
                            <h5 className="text-xs font-medium text-muted-foreground mb-2">Ingredients Used in This Order</h5>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                              {consumption.ingredients.map(ing => (
                                <li key={ing.id} className="flex justify-between py-1">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-900 dark:text-white">{ing.name}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {ing.quantity} {ing.unit}
                                      {ing.baseUnit && ing.baseUnit !== ing.unit && <span className="ml-1 text-xs text-muted-foreground">({ing.baseUnit})</span>}
                                    </span>
                                  </div>
                                  <div className="text-right text-sm font-mono text-gray-700 dark:text-gray-200 tabular-nums">
                                    <div>@ {formatCurrency(parseFloat(ing.cost_per_unit))}</div>
                                    <div className="font-bold">= {formatCurrency(parseFloat(ing.quantity) * parseFloat(ing.cost_per_unit))}</div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      <div className="flex justify-end pt-6 border-t mt-4 dark:border-gray-600">
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">Total: {formatCurrency(totalConsumption)}</div>
      </div>
    </div>
  );
};

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Activity, AlertTriangle, Package, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import { MeasurementUnit, MovementType, type MaterialConsumption } from "../../types";
import type { ConsumptionReportProps } from "../../types/reports.types";
import type { ReasonData, StockMovement } from "../../types/stock.types";
import { formatPacksBoxQuantityDisplay } from "../../utils/quantity";
import { Table } from "../ui";

const ConsumptionReport = ({ movements, stockEntries, rawMaterials, selectedSection, consumptionByCategory }: ConsumptionReportProps) => {
  const consumptionData = useMemo(() => {
    const consumptionMovements = movements.filter(movement => movement.type === MovementType.OUT || movement.type === MovementType.EXPIRED || movement.type === MovementType.DAMAGED);
    const filteredMovements = selectedSection ? consumptionMovements.filter(m => m.fromSectionId === selectedSection) : consumptionMovements;
    const totalQuantityConsumed = filteredMovements.reduce((sum, movement) => sum + movement.quantity, 0);

    const totalValueConsumed = filteredMovements.reduce((sum, movement) => {
      const entry = stockEntries.find(e => e.id === movement.stockEntryId);
      const material = rawMaterials.find(m => m.id === entry?.rawMaterialId);

      if (!material) return sum;

      const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
      if (isPackOrBox) {
        const packInfo = material as unknown as { unitsPerPack?: number; baseUnit?: string };
        const unitsPerPack = packInfo.unitsPerPack || 1;
        const individualCost = material.unitCost / unitsPerPack;
        return sum + movement.quantity * individualCost;
      } else {
        return sum + movement.quantity * material.unitCost;
      }
    }, 0);

    const byReason = filteredMovements.reduce(
      (acc, movement) => {
        const reason = movement.reason || "Unknown";
        if (!acc[reason]) {
          acc[reason] = { count: 0, totalValue: 0, movements: [] };
        }

        const entry = stockEntries.find(e => e.id === movement.stockEntryId);
        const material = rawMaterials.find(m => m.id === entry?.rawMaterialId);

        let value = 0;
        if (material) {
          const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
          if (isPackOrBox) {
            const packInfo = material as unknown as { unitsPerPack?: number; baseUnit?: string };
            const unitsPerPack = packInfo.unitsPerPack || 1;
            const individualCost = material.unitCost / unitsPerPack;
            value = movement.quantity * individualCost;
          } else {
            value = movement.quantity * material.unitCost;
          }
        }
        acc[reason].count += 1;
        acc[reason].totalValue += value;
        acc[reason].movements.push({ ...movement, material, value });
        return acc;
      },
      {} as Record<string, ReasonData>
    );

    const byMaterial = filteredMovements.reduce(
      (acc, movement) => {
        const entry = stockEntries.find(e => e.id === movement.stockEntryId);
        const material = rawMaterials.find(m => m.id === entry?.rawMaterialId);

        if (material) {
          if (!acc[material.id]) {
            acc[material.id] = {
              material,
              totalQuantity: 0,
              totalValue: 0,
              movements: []
            };
          }

          const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
          let value = 0;
          if (isPackOrBox) {
            const packInfo = material as unknown as { unitsPerPack?: number; baseUnit?: string };
            const unitsPerPack = packInfo.unitsPerPack || 1;
            const individualCost = material.unitCost / unitsPerPack;
            value = movement.quantity * individualCost;
          } else {
            value = movement.quantity * material.unitCost;
          }
          const materialData = acc[material.id] as MaterialConsumption;
          materialData.totalQuantity += movement.quantity;
          materialData.totalValue += value;
          materialData.movements.push({ ...movement, material, value });
        }
        return acc;
      },
      {} as Record<string, MaterialConsumption>
    );

    const wasteMovements = filteredMovements.filter(m => m.type === MovementType.EXPIRED || m.type === MovementType.DAMAGED);

    const wasteValue = wasteMovements.reduce((sum, movement) => {
      const entry = stockEntries.find(e => e.id === movement.stockEntryId);
      const material = rawMaterials.find(m => m.id === entry?.rawMaterialId);
      return sum + movement.quantity * (material?.unitCost || 0);
    }, 0);

    return {
      totalQuantityConsumed,
      totalValueConsumed,
      byReason,
      byMaterial,
      wasteValue,
      wasteCount: wasteMovements.length,
      totalMovements: filteredMovements.length
    };
  }, [movements, stockEntries, rawMaterials, selectedSection]);

  const topConsumedMaterials = Object.values(consumptionData.byMaterial)
    .sort((a: MaterialConsumption, b: MaterialConsumption) => b.totalValue - a.totalValue)
    .slice(0, 10);

  const categoryData = Object.entries(consumptionByCategory)
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);

  // Prepare table data by flattening movements from byMaterial
  const tableData = useMemo(() => {
    const data = Object.values(consumptionData.byMaterial).flatMap((materialConsumption: MaterialConsumption) =>
      materialConsumption.movements.map(movement => ({
        ...movement,
        material: materialConsumption.material
      }))
    );
    return data;
  }, [consumptionData.byMaterial]);

  const columns: ColumnDef<StockMovement>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.original.createdAt;
        return date ? format(date, "dd-MM-yyyy") : "-";
      },
      enableSorting: true,
      meta: { align: "left" },
      size: 120,
      minSize: 100,
      maxSize: 140
    },
    {
      accessorKey: "stockEntry.rawMaterial.name",
      header: "Material",
      cell: ({ row }) => row.original.stockEntry?.rawMaterial?.name || "Unknown",
      enableSorting: true,
      meta: { align: "left" },
      size: 120,
      minSize: 100,
      maxSize: 140
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => (row.original.quantity != null ? row.original.quantity : "-"),
      enableSorting: true,
      meta: { align: "left" },
      size: 120,
      minSize: 100,
      maxSize: 140
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => row.original.reason || "Unknown",
      enableSorting: true,
      meta: { align: "left" },
      size: 120,
      minSize: 100,
      maxSize: 140
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg dark:bg-blue-900/10 dark:border-blue-700">
          <div className="flex items-center">
            <TrendingDown className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Consumption Value</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">${consumptionData.totalValueConsumed.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg dark:bg-green-900/10 dark:border-green-700">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Movements</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{consumptionData.totalMovements}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg dark:bg-red-900/10 dark:border-red-700">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Waste Value</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">${consumptionData.wasteValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg dark:bg-purple-900/10 dark:border-purple-700">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Waste Incidents</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{consumptionData.wasteCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumption by Category */}
        <div className="bg-white p-6 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Consumption by Category</h3>
          <div className="space-y-3">
            {categoryData.map(({ category, value }) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{category.replace("_", " ")}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">${value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Consumed Materials */}
        <div className="bg-white p-6 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Consumed Materials</h3>
          <div className="space-y-3">
            {topConsumedMaterials.map((item: MaterialConsumption, index) => {
              const material = item.material as { id: string; name: string; unit: string };
              return (
                <div key={material.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{material.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">${item.totalValue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatPacksBoxQuantityDisplay(item.totalQuantity, material)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Consumption by Reason */}
      <div className="bg-white p-6 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Consumption by Reason</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(consumptionData.byReason).map(([reason, data]: [string, ReasonData]) => (
            <div key={reason} className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 capitalize">{reason}</h4>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{data.count}</span> movements
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Value: <span className="font-medium">${data.totalValue.toFixed(2)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Consumption Activity */}
      <div className="bg-white p-6 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
        <Table columns={columns} data={tableData} />
      </div>
    </div>
  );
};

export default ConsumptionReport;

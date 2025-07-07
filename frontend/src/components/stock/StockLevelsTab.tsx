import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Filter, Package, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useRawMaterials } from "../../hooks/useRawMaterials";
import { useStockLevels } from "../../hooks/useStock";
import type { MaterialCategory, SortConfig, StockLevel } from "../../types";
import { MeasurementUnit } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Table from "../ui/Table";

const StockLevelsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "available">("all");
  const [sortConfig] = useState<SortConfig>({ field: "rawMaterial.name", order: "asc" });

  const { data: stockLevels = [], isLoading } = useStockLevels();
  const { data: rawMaterials = [] } = useRawMaterials({ isActive: true });

  const categories = [...new Set(rawMaterials.map(m => m.category))];
  const categoryOptions = categories.map(category => ({
    value: category,
    label: category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ")
  }));

  const filteredData = useMemo(() => {
    const filtered = stockLevels.filter(level => {
      const material = level.rawMaterial;
      if (!material) return false;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!material.name.toLowerCase().includes(searchLower) && !material.supplier?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter && material.category !== categoryFilter) {
        return false;
      }

      // Stock status filter
      if (stockFilter === "low" && !level.isLowStock) return false;
      if (stockFilter === "available" && level.availableUnitsQuantity <= 0) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.field.includes(".")) {
        const [parent, child] = sortConfig.field.split(".");
        if (parent && child) {
          const aParent = (a as unknown as Record<string, unknown>)[parent];
          const bParent = (b as unknown as Record<string, unknown>)[parent];
          aValue = aParent && typeof aParent === "object" ? (aParent as Record<string, unknown>)[child] : undefined;
          bValue = bParent && typeof bParent === "object" ? (bParent as Record<string, unknown>)[child] : undefined;
        }
      } else {
        aValue = (a as unknown as Record<string, unknown>)[sortConfig.field];
        bValue = (b as unknown as Record<string, unknown>)[sortConfig.field];
      }

      if (aValue != null && bValue != null) {
        if (aValue < bValue) return sortConfig.order === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.order === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [stockLevels, searchTerm, categoryFilter, stockFilter, sortConfig]);

  // const formatQuantityDisplay = (subunitQty: number, material: StockLevel["rawMaterial"]) => {
  //   if (!material) return `${subunitQty}`;

  //   const unitsPerPack = material.unitsPerPack || 1;
  //   const packQty = subunitQty / unitsPerPack;

  //   const formattedPackQty = parseFloat(packQty.toFixed(1));
  //   const baseUnit = material.baseUnit || "units";

  //   return `${formattedPackQty} ${material.unit} (${subunitQty} ${baseUnit})`;
  // };
  const formatQuantityDisplay = (
    inputQty: number,
    material: StockLevel["rawMaterial"],
    isPackInput = false // ✅ default is subunit input
  ) => {
    if (!material) return `${inputQty}`;

    const unitsPerPack = material.unitsPerPack || 1;
    const baseUnit = material.baseUnit || "units";

    let packQty: number;
    let subunitQty: number;

    if (isPackInput) {
      packQty = inputQty;
      subunitQty = packQty * unitsPerPack;
    } else {
      subunitQty = inputQty;
      packQty = subunitQty / unitsPerPack;
    }

    return `${Math.round(packQty)} ${material.unit} (${subunitQty} ${baseUnit})`;
  };

  const calculateTotalValue = () => {
    return stockLevels.reduce((sum, level) => {
      const material = level.rawMaterial;
      if (!material) return sum;

      const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
      if (isPackOrBox) {
        // For pack/box items, we need to calculate based on subunit quantity and pack cost
        const costPerSubunit = material.unitCost / (material.unitsPerPack || 1);
        return sum + level.availableSubUnitsQuantity * costPerSubunit;
      }

      // For non-pack items, use direct unit cost
      return sum + level.availableSubUnitsQuantity * material.unitCost;
    }, 0);
  };

  const columns: ColumnDef<StockLevel>[] = [
    {
      id: "rawMaterial.name",
      accessorFn: row => row.rawMaterial?.name,
      header: "Material",
      cell: info => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{info.row.original.rawMaterial?.category}</p>
        </div>
      )
    },
    {
      id: "availableUnitsQuantity",
      accessorKey: "availableUnitsQuantity",
      header: "Available",
      cell: info => {
        const item = info.row.original;
        return (
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 dark:text-white">{formatQuantityDisplay(item.availableSubUnitsQuantity, item.rawMaterial)}</span>
            {item.isLowStock && <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />}
          </div>
        );
      }
    },
    {
      id: "totalUnitsQuantity",
      accessorKey: "totalUnitsQuantity",
      header: "Total Received",
      cell: info => {
        const item = info.row.original;
        return formatQuantityDisplay(item.totalSubUnitsQuantity, item.rawMaterial);
      }
    },
    {
      id: "minLevel",
      header: "Min Level",
      cell: info => {
        const item = info.row.original;
        const minLevelInPacks = item.rawMaterial?.minStockLevel || 0;
        return formatQuantityDisplay(minLevelInPacks, item.rawMaterial, true);
      }
    },
    {
      id: "maxLevel",
      header: "Max Level",
      cell: info => {
        const item = info.row.original;
        const maxLevelInPacks = item.rawMaterial?.maxStockLevel || 0;
        return formatQuantityDisplay(maxLevelInPacks, item.rawMaterial, true);
      }
    },
    {
      id: "status",
      header: "Status",
      cell: info => {
        const item = info.row.original;
        const availablePacks = item.availableSubUnitsQuantity / (item.rawMaterial?.unitsPerPack || 1);
        const minPacks = item.rawMaterial?.minStockLevel || 0;
        const maxPacks = item.rawMaterial?.maxStockLevel || 0;

        const isLowStock = availablePacks < minPacks;
        const isOverstocked = availablePacks > maxPacks;

        const statusText = isLowStock ? "Low Stock" : isOverstocked ? "Overstocked" : "Normal";

        const statusClass = isLowStock ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" : isOverstocked ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";

        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>{statusText}</span>;
      }
    },
    {
      id: "lastUpdated",
      accessorKey: "lastUpdated",
      header: "Last Updated",
      cell: info => new Date(info.getValue() as string).toLocaleDateString()
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Items</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stockLevels.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Low Stock</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">{stockLevels.filter(level => level.isLowStock).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Available</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{stockLevels.filter(level => level.availableUnitsQuantity > 0).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Value</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">${calculateTotalValue().toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input placeholder="Search materials..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />

        <Select placeholder="Filter by category" options={[{ value: "", label: "All Categories" }, ...categoryOptions]} value={categoryFilter} onChange={value => setCategoryFilter(value as MaterialCategory | "")} />

        <Select
          placeholder="Stock status"
          options={[
            { value: "all", label: "All Items" },
            { value: "low", label: "Low Stock Only" },
            { value: "available", label: "Available Only" }
          ]}
          value={stockFilter}
          onChange={value => setStockFilter(value as "all" | "low" | "available")}
        />

        <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
          More Filters
        </Button>
      </div>

      {/* Table */}
      <Table data={filteredData as unknown as Record<string, unknown>[]} columns={columns as unknown as ColumnDef<Record<string, unknown>>[]} loading={isLoading} emptyMessage="No stock levels found." />
    </div>
  );
};

export default StockLevelsTab;

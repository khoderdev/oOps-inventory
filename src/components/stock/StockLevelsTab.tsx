import { AlertTriangle, Filter, Package, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useRawMaterials } from "../../hooks/useRawMaterials";
import { useStockLevels } from "../../hooks/useStock";
import type { SortConfig, StockLevel } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Table from "../ui/Table";

const StockLevelsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "available">("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "rawMaterial.name", order: "asc" });

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
      if (stockFilter === "available" && level.availableQuantity <= 0) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.field.includes(".")) {
        const [parent, child] = sortConfig.field.split(".");
        aValue = (a as Record<string, unknown>)[parent]?.[child];
        bValue = (b as Record<string, unknown>)[parent]?.[child];
      } else {
        aValue = (a as Record<string, unknown>)[sortConfig.field];
        bValue = (b as Record<string, unknown>)[sortConfig.field];
      }

      if (aValue < bValue) return sortConfig.order === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [stockLevels, searchTerm, categoryFilter, stockFilter, sortConfig]);

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc"
    }));
  };

  const columns = [
    {
      key: "rawMaterial.name",
      title: "Material",
      sortable: true,
      render: (item: StockLevel) => (
        <div>
          <p className="font-medium text-gray-900">{item.rawMaterial?.name}</p>
          <p className="text-sm text-gray-500">{item.rawMaterial?.category}</p>
        </div>
      )
    },
    {
      key: "availableQuantity",
      title: "Available",
      sortable: true,
      render: (item: StockLevel) => (
        <div className="flex items-center space-x-2">
          <span className={`font-medium ${item.isLowStock ? "text-red-600" : "text-green-600"}`}>
            {item.availableQuantity} {item.rawMaterial?.unit}
          </span>
          {item.isLowStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
        </div>
      )
    },
    {
      key: "totalQuantity",
      title: "Total Received",
      sortable: true,
      render: (item: StockLevel) => `${item.totalQuantity} ${item.rawMaterial?.unit}`
    },
    {
      key: "minLevel",
      title: "Min Level",
      sortable: true,
      render: (item: StockLevel) => `${item.minLevel} ${item.rawMaterial?.unit}`
    },
    {
      key: "maxLevel",
      title: "Max Level",
      sortable: true,
      render: (item: StockLevel) => `${item.maxLevel} ${item.rawMaterial?.unit}`
    },
    {
      key: "status",
      title: "Status",
      render: (item: StockLevel) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isLowStock ? "bg-red-100 text-red-800" : item.availableQuantity > item.maxLevel ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>{item.isLowStock ? "Low Stock" : item.availableQuantity > item.maxLevel ? "Overstocked" : "Normal"}</span>
    },
    {
      key: "lastUpdated",
      title: "Last Updated",
      render: (item: StockLevel) => new Date(item.lastUpdated).toLocaleDateString()
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Items</p>
              <p className="text-2xl font-bold text-blue-900">{stockLevels.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">Low Stock</p>
              <p className="text-2xl font-bold text-red-900">{stockLevels.filter(level => level.isLowStock).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Available</p>
              <p className="text-2xl font-bold text-green-900">{stockLevels.filter(level => level.availableQuantity > 0).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-900">${stockLevels.reduce((sum, level) => sum + level.availableQuantity * (level.rawMaterial?.unitCost || 0), 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input placeholder="Search materials..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />

        <Select placeholder="Filter by category" options={[{ value: "", label: "All Categories" }, ...categoryOptions]} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} />

        <Select
          placeholder="Stock status"
          options={[
            { value: "all", label: "All Items" },
            { value: "low", label: "Low Stock Only" },
            { value: "available", label: "Available Only" }
          ]}
          value={stockFilter}
          onChange={e => setStockFilter(e.target.value as any)}
        />

        <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
          More Filters
        </Button>
      </div>

      {/* Table */}
      <Table data={filteredData} columns={columns} loading={isLoading} emptyMessage="No stock levels found." sortConfig={sortConfig} onSort={handleSort} />
    </div>
  );
};

export default StockLevelsTab;

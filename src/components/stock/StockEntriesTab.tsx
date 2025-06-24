import { Calendar, Package, Search, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { useRawMaterials } from "../../hooks/useRawMaterials";
import { useStockEntries } from "../../hooks/useStock";
import type { SortConfig, StockEntry } from "../../types";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Table from "../ui/Table";

const StockEntriesTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "receivedDate", order: "desc" });

  const { data: stockEntries = [], isLoading } = useStockEntries();
  const { data: rawMaterials = [] } = useRawMaterials({ isActive: true });

  // Get unique suppliers
  const suppliers = [...new Set(stockEntries.map(entry => entry.supplier).filter(Boolean))];
  const supplierOptions = suppliers.map(supplier => ({
    value: supplier!,
    label: supplier!
  }));

  const materialOptions = rawMaterials.map(material => ({
    value: material.id,
    label: material.name
  }));

  const filteredData = useMemo(() => {
    const filtered = stockEntries.filter(entry => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!entry.supplier?.toLowerCase().includes(searchLower) && !entry.batchNumber?.toLowerCase().includes(searchLower) && !entry.notes?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Supplier filter
      if (supplierFilter && entry.supplier !== supplierFilter) {
        return false;
      }

      // Material filter
      if (materialFilter && entry.rawMaterialId !== materialFilter) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = (a as any)[sortConfig.field];
      const bValue = (b as any)[sortConfig.field];

      if (aValue < bValue) return sortConfig.order === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [stockEntries, searchTerm, supplierFilter, materialFilter, sortConfig]);

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc"
    }));
  };

  const columns = [
    {
      key: "rawMaterialId",
      title: "Material",
      render: (item: StockEntry) => {
        const material = rawMaterials.find(m => m.id === item.rawMaterialId);
        return (
          <div>
            <p className="font-medium text-gray-900">{material?.name || "Unknown"}</p>
            <p className="text-sm text-gray-500">{material?.category}</p>
          </div>
        );
      }
    },
    {
      key: "quantity",
      title: "Quantity",
      sortable: true,
      render: (item: StockEntry) => {
        const material = rawMaterials.find(m => m.id === item.rawMaterialId);
        return `${item.quantity} ${material?.unit || ""}`;
      }
    },
    {
      key: "unitCost",
      title: "Unit Cost",
      sortable: true,
      render: (item: StockEntry) => `$${item.unitCost.toFixed(2)}`
    },
    {
      key: "totalCost",
      title: "Total Cost",
      sortable: true,
      render: (item: StockEntry) => `$${item.totalCost.toFixed(2)}`
    },
    {
      key: "supplier",
      title: "Supplier",
      render: (item: StockEntry) => (
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4 text-gray-400" />
          <span>{item.supplier || "-"}</span>
        </div>
      )
    },
    {
      key: "batchNumber",
      title: "Batch",
      render: (item: StockEntry) => item.batchNumber || "-"
    },
    {
      key: "receivedDate",
      title: "Received Date",
      sortable: true,
      render: (item: StockEntry) => new Date(item.receivedDate).toLocaleDateString()
    },
    {
      key: "expiryDate",
      title: "Expiry Date",
      render: (item: StockEntry) => {
        if (!item.expiryDate) return "-";
        const expiry = new Date(item.expiryDate);
        const isExpired = expiry < new Date();
        const isExpiringSoon = expiry < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        return <span className={`text-sm ${isExpired ? "text-red-600 font-medium" : isExpiringSoon ? "text-yellow-600 font-medium" : "text-gray-900"}`}>{expiry.toLocaleDateString()}</span>;
      }
    },
    {
      key: "receivedBy",
      title: "Received By",
      render: (item: StockEntry) => item.receivedBy
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Entries</p>
              <p className="text-2xl font-bold text-blue-900">{stockEntries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">This Month</p>
              <p className="text-2xl font-bold text-green-900">
                {
                  stockEntries.filter(entry => {
                    const entryDate = new Date(entry.receivedDate);
                    const thisMonth = new Date();
                    return entryDate.getMonth() === thisMonth.getMonth() && entryDate.getFullYear() === thisMonth.getFullYear();
                  }).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-900">${stockEntries.reduce((sum, entry) => sum + entry.totalCost, 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-red-900">
                {
                  stockEntries.filter(entry => {
                    if (!entry.expiryDate) return false;
                    const expiry = new Date(entry.expiryDate);
                    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    return expiry <= weekFromNow && expiry >= new Date();
                  }).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input placeholder="Search entries..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />

        <Select placeholder="Filter by supplier" options={[{ value: "", label: "All Suppliers" }, ...supplierOptions]} value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} />

        <Select placeholder="Filter by material" options={[{ value: "", label: "All Materials" }, ...materialOptions]} value={materialFilter} onChange={e => setMaterialFilter(e.target.value)} />

        <div></div>
      </div>

      {/* Table */}
      <Table data={filteredData} columns={columns} loading={isLoading} emptyMessage="No stock entries found." sortConfig={sortConfig} onSort={handleSort} />
    </div>
  );
};

export default StockEntriesTab;

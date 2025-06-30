import { Calendar, Edit, Package, Search, Trash2, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useRawMaterials } from "../../hooks/useRawMaterials";
import { useDeleteStockEntry, useStockEntries } from "../../hooks/useStock";
import type { SortConfig, StockEntry } from "../../types";
import { MeasurementUnit } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Table from "../ui/Table";
import StockEntryForm from "./StockEntryForm";

const StockEntriesTab = () => {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "receivedDate", order: "desc" });
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);

  const { data: stockEntries = [], isLoading } = useStockEntries();
  const { data: rawMaterials = [] } = useRawMaterials({ isActive: true });
  const deleteMutation = useDeleteStockEntry();

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
      const aValue = (a as unknown as Record<string, unknown>)[sortConfig.field] as string | number | undefined;
      const bValue = (b as unknown as Record<string, unknown>)[sortConfig.field] as string | number | undefined;

      if (aValue != null && bValue != null) {
        if (aValue < bValue) return sortConfig.order === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.order === "asc" ? 1 : -1;
      }
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

  const handleDelete = async (entry: StockEntry) => {
    if (window.confirm(`Are you sure you want to delete this stock entry? This action cannot be undone.`)) {
      try {
        await deleteMutation.mutateAsync(entry.id);
      } catch (error) {
        console.error("Error deleting stock entry:", error);
      }
    }
  };

  const columns = [
    {
      key: "rawMaterialId",
      title: "Material",
      render: (item: StockEntry) => {
        const material = rawMaterials.find(m => m.id === item.rawMaterialId);
        return (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{material?.name || "Unknown"}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{material?.category}</p>
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
        if (!material) return `${item.quantity}`;

        // Check if this is a pack/box material
        const isPackOrBox = material.unit.toUpperCase() === MeasurementUnit.PACKS.toUpperCase() || material.unit.toUpperCase() === MeasurementUnit.BOXES.toUpperCase();
        if (isPackOrBox) {
          // Convert base quantity back to pack quantity for display
          const packInfo = material as unknown as { unitsPerPack?: number; baseUnit?: string };
          const unitsPerPack = packInfo.unitsPerPack || 1;
          const baseUnit = packInfo.baseUnit || (material.unit === MeasurementUnit.PACKS ? "bottles" : "pieces");

          // Only convert if we have valid pack info, otherwise show base quantity
          if (packInfo.unitsPerPack && packInfo.unitsPerPack > 1) {
            const packQuantity = item.quantity / unitsPerPack;
            return `${packQuantity} ${material.unit} (${item.quantity} ${baseUnit})`;
          } else {
            // Fallback: show base quantity with unit
            return `${item.quantity} ${baseUnit} (Pack info not set)`;
          }
        }

        return `${item.quantity} ${material.unit || ""}`;
      }
    },
    {
      key: "unitCost",
      title: "Unit Cost",
      sortable: true,
      render: (item: StockEntry) => {
        const material = rawMaterials.find(m => m.id === item.rawMaterialId);
        if (!material) return `$${item.unitCost.toFixed(2)}`;

        // Check if this is a pack/box material
        const isPackOrBox = material.unit.toUpperCase() === MeasurementUnit.PACKS.toUpperCase() || material.unit.toUpperCase() === MeasurementUnit.BOXES.toUpperCase();
        if (isPackOrBox) {
          // For pack/box materials, unitCost is cost per pack/box
          const packInfo = material as unknown as { unitsPerPack?: number; baseUnit?: string };
          const unitsPerPack = packInfo.unitsPerPack || 1;
          const baseUnit = packInfo.baseUnit || "pieces";

          // Only show detailed breakdown if we have valid pack info
          if (packInfo.unitsPerPack && packInfo.unitsPerPack > 1) {
            const individualCost = item.unitCost / unitsPerPack;
            return (
              <div>
                <div className="font-medium">
                  ${item.unitCost.toFixed(2)} per {material.unit.toLowerCase()}
                </div>
                <div className="text-xs text-gray-500">
                  ${individualCost.toFixed(4)} per {baseUnit.toLowerCase()}
                </div>
              </div>
            );
          } else {
            // Fallback: show basic cost with note
            return (
              <div>
                <div className="font-medium">${item.unitCost.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Pack info not set</div>
              </div>
            );
          }
        }

        return `$${item.unitCost.toFixed(2)}`;
      }
    },
    {
      key: "totalCost",
      title: "Total Cost",
      sortable: true,
      render: (item: StockEntry) => {
        const material = rawMaterials.find(m => m.id === item.rawMaterialId);
        if (!material) return `$${item.totalCost.toFixed(2)}`;

        // Check if this is a pack/box material
        const isPackOrBox = material.unit.toUpperCase() === MeasurementUnit.PACKS.toUpperCase() || material.unit.toUpperCase() === MeasurementUnit.BOXES.toUpperCase();
        if (isPackOrBox) {
          // For pack/box materials, show both pack cost and individual cost
          const packInfo = material as unknown as { unitsPerPack?: number; baseUnit?: string };
          const unitsPerPack = packInfo.unitsPerPack || 1;
          const baseUnit = packInfo.baseUnit || "pieces";

          // Only show detailed breakdown if we have valid pack info
          if (packInfo.unitsPerPack && packInfo.unitsPerPack > 1) {
            const individualCost = item.unitCost / unitsPerPack;
            const totalIndividualCost = item.quantity * individualCost;
            const packQuantity = item.quantity / unitsPerPack;

            return (
              <div>
                <div className="font-medium">${item.totalCost.toFixed(2)}</div>
                <div className="text-xs text-gray-500">
                  {packQuantity.toFixed(1)} {material.unit.toLowerCase()} × ${item.unitCost.toFixed(2)} = ${item.totalCost.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {item.quantity} {baseUnit.toLowerCase()} × ${individualCost.toFixed(4)} = ${totalIndividualCost.toFixed(2)}
                </div>
              </div>
            );
          } else {
            // Fallback: show basic total with note
            return (
              <div>
                <div className="font-medium">${item.totalCost.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Pack info not set</div>
              </div>
            );
          }
        }

        return `$${item.totalCost.toFixed(2)}`;
      }
    },
    {
      key: "supplier",
      title: "Supplier",
      render: (item: StockEntry) => (
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4 text-gray-400 dark:text-gray-400" />
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

        return <span className={`text-sm ${isExpired ? "text-red-600 font-medium" : isExpiringSoon ? "text-yellow-600 font-medium" : "text-gray-900 dark:text-white"}`}>{expiry.toLocaleDateString()}</span>;
      }
    },
    {
      key: "receivedBy",
      title: "Received By",
      render: (item: StockEntry) => {
        if (item.user) {
          const fullName = `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim();
          return fullName || item.user.username || item.user.email || `User #${item.receivedBy}`;
        }
        return `User #${item.receivedBy}`;
      }
    },
    ...(state.user?.role === "MANAGER" || state.user?.role === "ADMIN"
      ? [
          {
            key: "actions",
            title: "Actions",
            render: (item: StockEntry) => (
              <div className="flex space-x-2">
                <Button size="sm" variant="ghost" onClick={() => setEditingEntry(item)} leftIcon={<Edit className="w-3 h-3" />}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(item)} leftIcon={<Trash2 className="w-3 h-3" />} className="text-red-600 hover:text-red-700">
                  Delete
                </Button>
              </div>
            )
          }
        ]
      : [])
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Entries</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stockEntries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">This Month</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">
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

        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Value</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">${stockEntries.reduce((sum, entry) => sum + entry.totalCost, 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Expiring Soon</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">
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
      <Table data={filteredData as unknown as Record<string, unknown>[]} columns={columns as unknown as Array<{ key: string; title: string; sortable?: boolean; render: (item: Record<string, unknown>, index: number) => React.ReactNode }>} loading={isLoading} emptyMessage="No stock entries found." sortConfig={sortConfig} onSort={handleSort} />

      {/* Edit Modal */}
      <Modal isOpen={!!editingEntry} onClose={() => setEditingEntry(null)} title="Edit Stock Entry" size="lg">
        {editingEntry && (
          <StockEntryForm
            initialData={editingEntry}
            onSuccess={() => {
              setEditingEntry(null);
            }}
            onCancel={() => setEditingEntry(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default StockEntriesTab;

import type { ColumnDef, Row } from "@tanstack/react-table";
import { Calendar, Edit, Package, Trash2, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useDeleteStockEntry, useStockEntries } from "../../hooks/useStock";
import type { SortConfig, StockEntry } from "../../types";
import { MeasurementUnit } from "../../types";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Table from "../ui/Table";
import StockEntryForm from "./StockEntryForm";

const StockEntriesTab = () => {
  const { state } = useApp();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "receivedDate", order: "desc" });
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);
  const [activeStatFilter, setActiveStatFilter] = useState<"ALL" | "MONTH" | "EXPIRING">("ALL");

  const { data: stockEntries = [], isLoading } = useStockEntries();
  const deleteMutation = useDeleteStockEntry();

  const filteredData = useMemo(() => {
    let filtered = stockEntries;

    // Stat box filter
    if (activeStatFilter === "MONTH") {
      const thisMonth = new Date();
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.receivedDate);
        return entryDate.getMonth() === thisMonth.getMonth() && entryDate.getFullYear() === thisMonth.getFullYear();
      });
    } else if (activeStatFilter === "EXPIRING") {
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const today = new Date();
      filtered = filtered.filter(entry => {
        if (!entry.expiryDate) return false;
        const expiry = new Date(entry.expiryDate);
        return expiry <= weekFromNow && expiry >= today;
      });
    }

    // Sorting
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
  }, [stockEntries, sortConfig, activeStatFilter]);

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc"
    }));
  };

  const handleDelete = async (entry: StockEntry) => {
    if (window.confirm(`Are you sure you want to delete this stock entry? This action cannot be undone.`)) {
      try {
        // First try normal delete
        const result = await deleteMutation.mutateAsync({ id: entry.id.toString() });

        // If there's an error about associated movements, offer to force delete
        if (!result.success && result.message?.includes("associated movements")) {
          const forceDelete = window.confirm(`This stock entry has associated movements. Would you like to force delete both the entry and all its movements?\n\nWarning: This will delete all movement records associated with this stock entry.`);

          if (forceDelete) {
            await deleteMutation.mutateAsync({ id: entry.id.toString(), force: true });
          }
        }
      } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "Failed to delete stock entry.";
        alert(message);
        console.error("Error deleting stock entry:", message);
      }
    }
  };

  const columns: ColumnDef<StockEntry>[] = [
    {
      accessorKey: "rawMaterialId",
      header: "Material",
      cell: ({ row }) => {
        const material = row.original.rawMaterial;
        return (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{material?.name || "Unknown"}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{material?.category}</p>
          </div>
        );
      }
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const material = row.original.rawMaterial;
        if (!material) return `${row.original.quantity}`;

        const isPackOrBox = material.unit.toUpperCase() === MeasurementUnit.PACKS.toUpperCase() || material.unit.toUpperCase() === MeasurementUnit.BOXES.toUpperCase();
        if (isPackOrBox) {
          const packInfo = material as unknown as { unitsPerPack?: number; baseUnit?: string };
          const unitsPerPack = packInfo.unitsPerPack || 1;
          const baseUnit = packInfo.baseUnit || (material.unit === MeasurementUnit.PACKS ? "bottles" : "pieces");

          if (packInfo.unitsPerPack && packInfo.unitsPerPack > 1) {
            const packQuantity = row.original.quantity / unitsPerPack;
            return `${packQuantity} ${material.unit} (${row.original.quantity} ${baseUnit})`;
          } else {
            return `${row.original.quantity} ${baseUnit} (Pack info not set)`;
          }
        }
        return `${row.original.quantity} ${row.original.convertedUnit}`;
      }
    },
    {
      accessorKey: "unitCost",
      header: "Unit Cost",
      cell: ({ row }) => {
        const material = row.original.rawMaterial;
        const unitCost = row.original.unitCost;

        if (!material) return `$${unitCost.toFixed(2)}`;

        const unit = material.unit?.toUpperCase();
        const isPackOrBox = unit === MeasurementUnit.PACKS || unit === MeasurementUnit.BOXES;
        const smallUnits = ["GRAMS", "PIECES", "BOTTLES"];
        const isSmallUnit = smallUnits.includes(unit);

        // Handle PACKS or BOXES
        if (isPackOrBox) {
          const packInfo = material as unknown as { unitsPerPack?: number; baseUnit?: string };
          const unitsPerPack = packInfo.unitsPerPack || 1;
          const baseUnit = packInfo.baseUnit || "pieces";

          if (unitsPerPack > 1) {
            const individualCost = unitCost / unitsPerPack;
            return (
              <div>
                <div className="font-medium">
                  ${unitCost.toFixed(2)} per {unit.toLowerCase()}
                </div>
                <div className="text-xs text-gray-500">
                  ${individualCost.toFixed(2)} per {baseUnit.toLowerCase()}
                </div>
              </div>
            );
          } else {
            return (
              <div>
                <div className="font-medium">${unitCost.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Pack info not set</div>
              </div>
            );
          }
        }
        // Use 4 decimal places for small units like GRAMS/PIECES
        if (isSmallUnit) {
          return <span className="font-mono text-sm font-medium text-green-600 dark:text-green-400">${unitCost.toFixed(4)}</span>;
        }
        // Default
        return <span className="font-mono text-sm font-medium text-green-600 dark:text-green-400">${unitCost.toFixed(2)}</span>;
      }
    },

    {
      accessorKey: "totalCost",
      header: "Total Cost",
      cell: ({ row }) => {
        const material = row.original.rawMaterial;
        if (!material) return `$${row.original.totalCost.toFixed(2)}`;

        const isPackOrBox = material.unit.toUpperCase() === MeasurementUnit.PACKS.toUpperCase() || material.unit.toUpperCase() === MeasurementUnit.BOXES.toUpperCase();
        if (isPackOrBox) {
          const packInfo = material as unknown as { unitsPerPack?: number; baseUnit?: string };
          const unitsPerPack = packInfo.unitsPerPack || 1;
          const baseUnit = packInfo.baseUnit || "pieces";

          if (packInfo.unitsPerPack && packInfo.unitsPerPack > 1) {
            const individualCost = row.original.unitCost / unitsPerPack;
            const totalIndividualCost = row.original.quantity * individualCost;
            const packQuantity = row.original.quantity / unitsPerPack;

            return (
              <div>
                <div className="font-medium">${row.original.totalCost.toFixed(2)}</div>
                <div className="text-xs text-gray-500">
                  {packQuantity.toFixed(1)} {material.unit.toLowerCase()} × ${row.original.unitCost.toFixed(2)} = ${row.original.totalCost.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {row.original.quantity} {baseUnit.toLowerCase()} × ${individualCost.toFixed(4)} = ${totalIndividualCost.toFixed(2)}
                </div>
              </div>
            );
          } else {
            return (
              <div>
                <div className="font-medium">${row.original.totalCost.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Pack info not set</div>
              </div>
            );
          }
        }

        return `$${row.original.totalCost.toFixed(2)}`;
      }
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4 text-gray-400 dark:text-gray-400" />
          <span>{row.original.supplier || "-"}</span>
        </div>
      )
    },
    {
      accessorKey: "receivedDate",
      header: "Received Date",
      cell: ({ row }) => new Date(row.original.receivedDate).toLocaleDateString()
    },

    ...(state.user?.role === "MANAGER" || state.user?.role === "ADMIN"
      ? [
          {
            accessorKey: "actions",
            header: "Actions",
            cell: ({ row }: { row: Row<StockEntry> }) => (
              <div className="flex space-x-2">
                <Button size="sm" variant="ghost" onClick={() => setEditingEntry(row.original)} leftIcon={<Edit className="w-3 h-3" />}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(row.original)} leftIcon={<Trash2 className="w-3 h-3" />} className="text-red-600 hover:text-red-700">
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
        {/* Total Entries - resets filters */}
        <div onClick={() => setActiveStatFilter("ALL")} className={`cursor-pointer transition-all p-4 rounded-lg ${activeStatFilter === "ALL" ? "ring-2 ring-blue-500 bg-blue-100 dark:ring-blue-400 dark:bg-blue-900/20" : "bg-blue-50 dark:bg-blue-900/10"}`}>
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Entries</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stockEntries.length}</p>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div onClick={() => setActiveStatFilter("MONTH")} className={`cursor-pointer transition-all p-4 rounded-lg ${activeStatFilter === "MONTH" ? "ring-2 ring-green-500 bg-green-100 dark:ring-green-400 dark:bg-green-900/20" : "bg-green-50 dark:bg-green-900/10"}`}>
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

        {/* Total Value (No Filter) */}
        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Value</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">${stockEntries.reduce((sum, entry) => sum + entry.totalCost, 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div onClick={() => setActiveStatFilter("EXPIRING")} className={`cursor-pointer transition-all p-4 rounded-lg ${activeStatFilter === "EXPIRING" ? "ring-2 ring-red-500 bg-red-100 dark:ring-red-400 dark:bg-red-900/20" : "bg-red-50 dark:bg-red-900/10"}`}>
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

      {/* Table */}
      <Table data={filteredData as unknown as Record<string, unknown>[]} columns={columns} loading={isLoading} emptyMessage="No stock entries found." sortConfig={sortConfig} onSort={handleSort} />

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

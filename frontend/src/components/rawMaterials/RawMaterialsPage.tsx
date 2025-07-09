import type { ColumnDef } from "@tanstack/react-table";
import { clsx } from "clsx";
import { AlertTriangle, Edit, Filter, Package, PlusIcon, Search, Trash2 } from "lucide-react";
import { useCallback, useContext, useMemo, useState } from "react";
import { AppContext } from "../../contexts/AppContext";
import useFloatingButtonVisibility from "../../hooks/useFloatingButtonVisibility";
import { useDeleteRawMaterial, useRawMaterials } from "../../hooks/useRawMaterials";
import { useStockLevels } from "../../hooks/useStock";
import { useSuppliers } from "../../hooks/useSuppliers";
import { MaterialCategory, type RawMaterial, type SortConfig, type User } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Table from "../ui/Table";
import RawMaterialForm from "./RawMaterialForm";

const RawMaterialsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<MaterialCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [sortConfig] = useState<SortConfig>({ field: "name", order: "asc" });
  const {
    state: { user }
  } = useContext(AppContext) as { state: { user: User } };
  const { data: rawMaterials = [], isLoading } = useRawMaterials();
  const { data: stockLevels = [] } = useStockLevels();
  const { data: suppliersData } = useSuppliers();
  const deleteMutation = useDeleteRawMaterial();

  const categoryOptions = Object.values(MaterialCategory).map(category => ({
    value: category,
    label: category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ")
  }));

  const statusOptions = [
    { value: "all", label: "All Materials" },
    { value: "active", label: "Active Only" },
    { value: "inactive", label: "Inactive Only" }
  ];

  const filteredData = useMemo(() => {
    const filtered = rawMaterials.filter(material => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!material.name.toLowerCase().includes(searchLower) && !material.supplier?.toLowerCase().includes(searchLower) && !material.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter && material.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "active" && !material.isActive) return false;
      if (statusFilter === "inactive" && material.isActive) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = (a as unknown as Record<string, unknown>)[sortConfig.field];
      const bValue = (b as unknown as Record<string, unknown>)[sortConfig.field];

      if (aValue != null && bValue != null) {
        if (aValue < bValue) return sortConfig.order === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.order === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [rawMaterials, searchTerm, categoryFilter, statusFilter, sortConfig]);

  const handleDelete = useCallback(
    async (material: RawMaterial) => {
      if (window.confirm(`Are you sure you want to delete "${material.name}"? This action cannot be undone.`)) {
        try {
          await deleteMutation.mutateAsync(material.id.toString());
        } catch (error) {
          console.error("Error deleting material:", error);
        }
      }
    },
    [deleteMutation]
  );

  const getStockStatus = useCallback(
    (materialId: string) => {
      const stockLevel = stockLevels.find(level => level.rawMaterial?.id === parseInt(materialId));
      if (!stockLevel) return { status: "no-stock", quantity: 0, unit: "" };

      return {
        status: stockLevel.isLowStock ? "low" : "normal",
        quantity: stockLevel.availableUnitsQuantity,
        unit: stockLevel.rawMaterial?.unit || "",
        isLowStock: stockLevel.isLowStock
      };
    },
    [stockLevels]
  );

  // Helper function to get supplier name from ID
  const getSupplierName = useCallback(
    (supplierId: string | null) => {
      if (!supplierId || !suppliersData?.suppliers) return "";

      const supplier = suppliersData.suppliers.find(s => s.id.toString() === supplierId.toString());
      return supplier ? supplier.name : "";
    },
    [suppliersData]
  );

  // Calculate stats
  const activeCount = rawMaterials.filter(m => m.isActive).length;
  const lowStockCount = rawMaterials.filter(m => {
    const stock = getStockStatus(m.id.toString());
    return stock.isLowStock;
  }).length;
  const categoryBreakdown = rawMaterials.reduce(
    (acc, material) => {
      if (material.isActive) {
        acc[material.category] = (acc[material.category] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const columns: ColumnDef<RawMaterial>[] = useMemo(() => {
    const baseColumns: ColumnDef<RawMaterial>[] = [
      {
        id: "name",
        accessorKey: "name",
        header: "Material",
        size: 250,
        minSize: 200,
        maxSize: 400,
        enableSorting: true,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate" title={item.name}>
                {item.name}
              </p>
              {item.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={item.description}>
                  {item.description}
                </p>
              )}
            </div>
          );
        }
      },
      {
        id: "category",
        accessorKey: "category",
        header: "Category",
        size: 140,
        minSize: 120,
        maxSize: 180,
        enableSorting: true,
        cell: ({ row }) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 capitalize whitespace-nowrap">{row.original.category.replace("_", " ")}</span>,
        meta: {
          align: "center"
        }
      },
      {
        id: "unit",
        accessorKey: "unit",
        header: "Unit",
        size: 80,
        minSize: 60,
        maxSize: 120,
        enableSorting: true,
        cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span>,
        meta: {
          align: "center"
        }
      },
      {
        id: "unitCost",
        accessorKey: "unitCost",
        header: "Unit Cost",
        size: 110,
        minSize: 90,
        maxSize: 140,
        enableSorting: true,
        cell: ({ row }) => {
          const material = row.original;
          const unit = material.unit;
          const cost = material.unitCost;
          const smallUnits = ["GRAMS", "PIECES", "BOTTLES"];
          const isSmallUnit = smallUnits.includes(unit);
          const formatted = isSmallUnit
            ? `$${Math.ceil(cost * 10000) / 10000}` // Rounded up to 4 digits
            : `$${cost.toFixed(2)}`;

          return <span className="font-mono text-sm font-medium text-green-600 dark:text-green-400">{formatted}</span>;
        },
        meta: {
          align: "right"
        }
      },
      {
        id: "supplier",
        accessorKey: "supplier",
        header: "Supplier",
        size: 150,
        minSize: 120,
        maxSize: 200,
        enableSorting: true,
        cell: ({ row }) => {
          const supplierId = row.original.supplier;
          const supplierName = getSupplierName(supplierId?.toString() || null);
          return (
            <span className="truncate" title={supplierName || "No supplier"}>
              {supplierName || "-"}
            </span>
          );
        }
      },
      {
        id: "stock",
        accessorKey: "stock",
        header: "Current Stock",
        size: 140,
        minSize: 120,
        maxSize: 180,
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          const stock = getStockStatus(item.id.toString());
          return (
            <div className="flex items-center justify-center space-x-2">
              <span
                className={clsx("font-medium text-sm", {
                  "text-red-600 dark:text-red-400": stock.status === "low",
                  "text-gray-400 dark:text-gray-500": stock.status === "no-stock",
                  "text-green-600 dark:text-green-400": stock.status === "normal"
                })}
              >
                {stock.quantity} {stock.unit}
              </span>
              {stock.isLowStock && (
                <div title="Low stock warning">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                </div>
              )}
            </div>
          );
        },
        meta: {
          align: "center"
        }
      },
      {
        id: "isActive",
        accessorKey: "isActive",
        header: "Status",
        size: 90,
        minSize: 80,
        maxSize: 120,
        enableSorting: true,
        cell: ({ row }) => {
          const item = row.original;
          return <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", item.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400")}>{item.isActive ? "Active" : "Inactive"}</span>;
        },
        meta: {
          align: "center"
        }
      }
    ];

    const actionColumn: ColumnDef<RawMaterial> = {
      id: "actions",
      header: "Actions",
      size: 140,
      minSize: 120,
      maxSize: 180,
      enableSorting: false,
      enableResizing: true,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-end space-x-1">
            <Button size="sm" variant="ghost" onClick={() => setEditingMaterial(item)} leftIcon={<Edit className="w-3 h-3" />} className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors">
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(item)} leftIcon={<Trash2 className="w-3 h-3" />} className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 transition-colors">
              Delete
            </Button>
          </div>
        );
      },
      meta: {
        align: "right"
      }
    };

    return user?.role === "MANAGER" || user?.role === "ADMIN" ? [...baseColumns, actionColumn] : baseColumns;
  }, [user, getStockStatus, handleDelete]);

  const floating = true;

  const { visible: isVisible } = useFloatingButtonVisibility({
    minScrollDistance: 200,
    showOnTop: true
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      {user?.role === "MANAGER" ||
        (user?.role === "ADMIN" && (!floating || isVisible) && (
          <Button floating={floating} animationType="scale" threshold={15} autoHideDelay={500} minScrollDistance={200} variant="primary" leftIcon={<PlusIcon />} onClick={() => setShowCreateModal(true)}>
            Add Material
          </Button>
        ))}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg dark:bg-blue-900/10 dark:text-white">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Materials</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-400">{rawMaterials.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg dark:bg-green-900/10 dark:text-white">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Materials</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-400">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg dark:bg-red-900/10 dark:text-white">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Low Stock</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-400">{lowStockCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg dark:bg-purple-900/10 dark:text-white">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Categories</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-400">{Object.keys(categoryBreakdown).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Search materials..." value={searchTerm} onValueChange={e => setSearchTerm(e)} leftIcon={<Search className="w-4 h-4" />} />

          <Select placeholder="Filter by category" options={[{ value: "", label: "All Categories" }, ...categoryOptions]} value={categoryFilter} onChange={value => setCategoryFilter(value as MaterialCategory | "")} />

          <Select placeholder="Filter by status" options={statusOptions} value={statusFilter} onChange={value => setStatusFilter(value as "all" | "active" | "inactive")} />

          <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <Table data={filteredData} columns={columns} loading={isLoading} emptyMessage="No raw materials found. Add your first material to get started." enableColumnResizing={true} enableSorting={true} maxHeight="600px" stickyHeader={true} className="rounded-lg" />
      </div>

      {/* Create Material Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Material" size="lg">
        <RawMaterialForm
          onSuccess={() => {
            setShowCreateModal(false);
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Material Modal */}
      <Modal isOpen={!!editingMaterial} onClose={() => setEditingMaterial(null)} title={editingMaterial ? `Edit Material - ${editingMaterial.name}` : "Edit Material"} size="lg">
        {editingMaterial && (
          <RawMaterialForm
            key={editingMaterial.id} // Force re-render when editing different materials
            initialData={editingMaterial}
            onSuccess={() => {
              setEditingMaterial(null);
            }}
            onCancel={() => setEditingMaterial(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default RawMaterialsPage;

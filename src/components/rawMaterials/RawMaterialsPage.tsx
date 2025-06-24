import { AlertTriangle, Edit, Filter, Package, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useDeleteRawMaterial, useRawMaterials } from "../../hooks/useRawMaterials";
import { useStockLevels } from "../../hooks/useStock";
import { MaterialCategory, type RawMaterial, type SortConfig } from "../../types";
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
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "name", order: "asc" });

  const { data: rawMaterials = [], isLoading } = useRawMaterials();
  const { data: stockLevels = [] } = useStockLevels();
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

      if (aValue < bValue) return sortConfig.order === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [rawMaterials, searchTerm, categoryFilter, statusFilter, sortConfig]);

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc"
    }));
  };

  const handleDelete = async (material: RawMaterial) => {
    if (window.confirm(`Are you sure you want to delete "${material.name}"? This action cannot be undone.`)) {
      try {
        await deleteMutation.mutateAsync(material.id);
      } catch (error) {
        console.error("Error deleting material:", error);
      }
    }
  };

  const getStockStatus = (materialId: string) => {
    const stockLevel = stockLevels.find(level => level.rawMaterialId === materialId);
    if (!stockLevel) return { status: "no-stock", quantity: 0, unit: "" };

    return {
      status: stockLevel.isLowStock ? "low" : "normal",
      quantity: stockLevel.availableQuantity,
      unit: stockLevel.rawMaterial?.unit || "",
      isLowStock: stockLevel.isLowStock
    };
  };

  // Calculate stats
  const activeCount = rawMaterials.filter(m => m.isActive).length;
  const lowStockCount = rawMaterials.filter(m => {
    const stock = getStockStatus(m.id);
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

  const columns = [
    {
      key: "name",
      title: "Material",
      sortable: true,
      render: (item: RawMaterial) => (
        <div>
          <p className="font-medium text-gray-900">{item.name}</p>
          <p className="text-sm text-gray-500">{item.description}</p>
        </div>
      )
    },
    {
      key: "category",
      title: "Category",
      sortable: true,
      render: (item: RawMaterial) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">{item.category.replace("_", " ")}</span>
    },
    {
      key: "unit",
      title: "Unit",
      render: (item: RawMaterial) => item.unit
    },
    {
      key: "unitCost",
      title: "Unit Cost",
      sortable: true,
      render: (item: RawMaterial) => `$${item.unitCost.toFixed(2)}`
    },
    {
      key: "supplier",
      title: "Supplier",
      render: (item: RawMaterial) => item.supplier || "-"
    },
    {
      key: "stock",
      title: "Current Stock",
      render: (item: RawMaterial) => {
        const stock = getStockStatus(item.id);
        return (
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${stock.status === "low" ? "text-red-600" : stock.status === "no-stock" ? "text-gray-400" : "text-green-600"}`}>
              {stock.quantity} {stock.unit}
            </span>
            {stock.isLowStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
        );
      }
    },
    {
      key: "isActive",
      title: "Status",
      render: (item: RawMaterial) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{item.isActive ? "Active" : "Inactive"}</span>
    },
    {
      key: "actions",
      title: "Actions",
      render: (item: RawMaterial) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" onClick={() => setEditingMaterial(item)} leftIcon={<Edit className="w-3 h-3" />}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(item)} leftIcon={<Trash2 className="w-3 h-3" />} className="text-red-600 hover:text-red-700">
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raw Materials</h1>
          <p className="text-gray-600">Manage your inventory materials and ingredients</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Material
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Materials</p>
              <p className="text-2xl font-bold text-blue-900">{rawMaterials.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Active Materials</p>
              <p className="text-2xl font-bold text-green-900">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Low Stock</p>
              <p className="text-2xl font-bold text-red-900">{lowStockCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Categories</p>
              <p className="text-2xl font-bold text-purple-900">{Object.keys(categoryBreakdown).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Search materials..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />

          <Select placeholder="Filter by category" options={[{ value: "", label: "All Categories" }, ...categoryOptions]} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as MaterialCategory | "")} />

          <Select placeholder="Filter by status" options={statusOptions} value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} />

          <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table data={filteredData} columns={columns} loading={isLoading} emptyMessage="No raw materials found. Add your first material to get started." sortConfig={sortConfig} onSort={handleSort} />
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
      <Modal isOpen={!!editingMaterial} onClose={() => setEditingMaterial(null)} title="Edit Material" size="lg">
        {editingMaterial && (
          <RawMaterialForm
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

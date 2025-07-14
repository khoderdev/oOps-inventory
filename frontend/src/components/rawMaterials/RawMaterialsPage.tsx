// import { PlusIcon } from "lucide-react";
// import { useCallback, useContext, useMemo, useState } from "react";
// import { AppContext } from "../../contexts/AppContext";
// import useFloatingButtonVisibility from "../../hooks/useFloatingButtonVisibility";
// import { useDeleteRawMaterial, useRawMaterials } from "../../hooks/useRawMaterials";
// import { Category, type RawMaterial, type SortConfig, type User } from "../../types";
// import Button from "../ui/Button";
// import Modal from "../ui/Modal";
// import RawMaterialForm from "./RawMaterialForm";
// import { RawMaterialsFilters } from "./RawMaterialsFilters";
// import { RawMaterialsStats } from "./RawMaterialsStats";
// import { RawMaterialsTable } from "./RawMaterialsTable";

// export const RawMaterialsPage = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [categoryFilter, setCategoryFilter] = useState<Category | "">("");
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
//   const [sortConfig] = useState<SortConfig>({ field: "name", order: "asc" });
//   const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
//   const {
//     state: { user }
//   } = useContext(AppContext) as { state: { user: User } };
//   const { data: rawMaterials = [], isLoading } = useRawMaterials();
//   const deleteMutation = useDeleteRawMaterial();
//   const categoryOptions = Object.values(Category).map(category => ({ value: category, label: category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ") }));
//   const activeCount = rawMaterials.filter(material => material.isActive).length;
//   const lowStockCount = rawMaterials.filter(material => material.quantity < material.reorderLevel).length;
//   const categoryBreakdown = rawMaterials.reduce(
//     (acc, material) => {
//       if (!acc[material.category]) {
//         acc[material.category] = 0;
//       }
//       acc[material.category]++;
//       return acc;
//     },
//     {} as Record<Category, number>
//   );
//   const statusOptions: Array<{ value: "all" | "active" | "inactive"; label: string }> = [
//     { value: "all", label: "All Materials" },
//     { value: "active", label: "Active Only" },
//     { value: "inactive", label: "Inactive Only" }
//   ];

//   const filteredData = useMemo(() => {
//     const filtered = rawMaterials.filter(material => {
//       if (searchTerm) {
//         const searchLower = searchTerm.toLowerCase();
//         if (!material.name.toLowerCase().includes(searchLower) && !material.supplier?.toLowerCase().includes(searchLower) && !material.description?.toLowerCase().includes(searchLower)) {
//           return false;
//         }
//       }
//       if (categoryFilter && material.category !== categoryFilter) {
//         return false;
//       }
//       if (statusFilter === "active" && !material.isActive) return false;
//       if (statusFilter === "inactive" && material.isActive) return false;

//       return true;
//     });

//     filtered.sort((a, b) => {
//       const aValue = (a as unknown as Record<string, unknown>)[sortConfig.field];
//       const bValue = (b as unknown as Record<string, unknown>)[sortConfig.field];
//       if (aValue != null && bValue != null) {
//         if (aValue < bValue) return sortConfig.order === "asc" ? -1 : 1;
//         if (aValue > bValue) return sortConfig.order === "asc" ? 1 : -1;
//       }
//       return 0;
//     });

//     return filtered;
//   }, [rawMaterials, searchTerm, categoryFilter, statusFilter, sortConfig]);

//   const handleDelete = useCallback(
//     async (material: RawMaterial) => {
//       if (window.confirm(`Are you sure you want to delete "${material.name}"? This action cannot be undone.`)) {
//         try {
//           await deleteMutation.mutateAsync(material.id.toString());
//         } catch (error) {
//           console.error("Error deleting material:", error);
//         }
//       }
//     },
//     [deleteMutation]
//   );

//   const floating = true;
//   const { visible: isVisible } = useFloatingButtonVisibility({
//     minScrollDistance: 200,
//     showOnTop: true
//   });

//   return (
//     <div className="space-y-6">
//       {/* Floating Add Button */}
//       {(user?.role === "MANAGER" || user?.role === "ADMIN") && (!floating || isVisible) && (
//         <Button floating={floating} animationType="scale" threshold={15} autoHideDelay={500} minScrollDistance={200} variant="primary" leftIcon={<PlusIcon />} onClick={() => setShowCreateModal(true)}>
//           Add Material
//         </Button>
//       )}

//       {/* Stats Cards */}
//       <RawMaterialsStats total={rawMaterials.length} active={activeCount} lowStock={lowStockCount} categories={Object.keys(categoryBreakdown).length} />
//       {/* Filters */}
//       <RawMaterialsFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} categoryOptions={categoryOptions} statusOptions={statusOptions} />

//       {/* Materials Table */}
//       <RawMaterialsTable data={filteredData} loading={isLoading} userRole={user?.role} onEdit={setEditingMaterial} onDelete={handleDelete} />

//       {/* Create Material Modal */}
//       <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Material" size="lg">
//         <RawMaterialForm
//           onSuccess={() => {
//             setShowCreateModal(false);
//           }}
//           onCancel={() => setShowCreateModal(false)}
//         />
//       </Modal>

//       {/* Edit Material Modal */}
//       <Modal isOpen={!!editingMaterial} onClose={() => setEditingMaterial(null)} title={editingMaterial ? `Edit Material - ${editingMaterial.name}` : "Edit Material"} size="lg">
//         {editingMaterial && (
//           <RawMaterialForm
//             key={editingMaterial.id}
//             initialData={editingMaterial}
//             onSuccess={() => {
//               setEditingMaterial(null);
//             }}
//             onCancel={() => setEditingMaterial(null)}
//           />
//         )}
//       </Modal>
//     </div>
//   );
// };
import { PlusIcon } from "lucide-react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../../contexts/AppContext";
import { categoriesApi } from "../../data/categories.api";
import useFloatingButtonVisibility from "../../hooks/useFloatingButtonVisibility";
import { useDeleteRawMaterial, useRawMaterials } from "../../hooks/useRawMaterials";
import { type Category, type CategoryResponse, type RawMaterial, type SortConfig, type User } from "../../types";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import RawMaterialForm from "./RawMaterialForm";
import { RawMaterialsFilters } from "./RawMaterialsFilters";
import { RawMaterialsStats } from "./RawMaterialsStats";
import { RawMaterialsTable } from "./RawMaterialsTable";

export const RawMaterialsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "">("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [sortConfig] = useState<SortConfig>({ field: "name", order: "asc" });
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryOptions, setCategoryOptions] = useState<{ value: Category; label: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const {
    state: { user }
  } = useContext(AppContext) as { state: { user: User } };
  const { data: rawMaterials = [], isLoading } = useRawMaterials();
  const deleteMutation = useDeleteRawMaterial();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const categories = await categoriesApi.getCategories();
        const options = categories.map((cat: CategoryResponse) => ({
          value: cat.name,
          label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1).replace("_", " ")
        }));
        setCategoryOptions(options);
      } catch (error) {
        console.error("Failed to load categories", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const activeCount = rawMaterials.filter(material => material.isActive).length;
  const lowStockCount = rawMaterials.filter(material => material.quantity < material.reorderLevel).length;
  const categoryBreakdown = rawMaterials.reduce(
    (acc, material) => {
      if (!acc[material.category]) {
        acc[material.category] = 0;
      }
      acc[material.category]++;
      return acc;
    },
    {} as Record<Category, number>
  );

  const statusOptions: Array<{ value: "all" | "active" | "inactive"; label: string }> = [
    { value: "all", label: "All Materials" },
    { value: "active", label: "Active Only" },
    { value: "inactive", label: "Inactive Only" }
  ];

  const filteredData = useMemo(() => {
    const filtered = rawMaterials.filter(material => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!material.name.toLowerCase().includes(searchLower) && !material.supplier?.toLowerCase().includes(searchLower) && !material.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (categoryFilter && material.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === "active" && !material.isActive) return false;
      if (statusFilter === "inactive" && material.isActive) return false;

      return true;
    });

    filtered.sort((a, b) => {
      const aValue = (a as any)[sortConfig.field];
      const bValue = (b as any)[sortConfig.field];
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

  const floating = true;
  const { visible: isVisible } = useFloatingButtonVisibility({
    minScrollDistance: 200,
    showOnTop: true
  });

  return (
    <div className="space-y-6">
      {(user?.role === "MANAGER" || user?.role === "ADMIN") && (!floating || isVisible) && (
        <Button floating={floating} animationType="scale" threshold={15} autoHideDelay={500} minScrollDistance={200} variant="primary" leftIcon={<PlusIcon />} onClick={() => setShowCreateModal(true)}>
          Add Material
        </Button>
      )}

      <RawMaterialsStats total={rawMaterials.length} active={activeCount} lowStock={lowStockCount} categories={Object.keys(categoryBreakdown).length} />

      <RawMaterialsFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} categoryOptions={categoryOptions} statusOptions={statusOptions} />

      <RawMaterialsTable data={filteredData} loading={isLoading} userRole={user?.role} onEdit={setEditingMaterial} onDelete={handleDelete} />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Material" size="lg">
        <RawMaterialForm onSuccess={() => setShowCreateModal(false)} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      <Modal isOpen={!!editingMaterial} onClose={() => setEditingMaterial(null)} title={editingMaterial ? `Edit Material - ${editingMaterial.name}` : "Edit Material"} size="lg">
        {editingMaterial && <RawMaterialForm key={editingMaterial.id} initialData={editingMaterial} onSuccess={() => setEditingMaterial(null)} onCancel={() => setEditingMaterial(null)} />}
      </Modal>
    </div>
  );
};

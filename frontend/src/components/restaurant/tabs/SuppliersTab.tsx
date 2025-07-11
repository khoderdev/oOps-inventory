import type { ColumnDef } from "@tanstack/react-table";
import React, { useMemo, useState } from "react";
import { useCreateSupplier, useSuppliers, useUpdateSupplier } from "../../../hooks/useSuppliers";
import type { CreateSupplierRequest, SupplierFilters, SupplierType } from "../../../types";
import { SupplierForm } from "../../forms/SupplierForm";
import { Button, Modal, Table } from "../../ui";

export const SuppliersTab: React.FC = () => {
  const [filters] = useState<SupplierFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierType | null>(null);
  const { data: suppliersData, isLoading } = useSuppliers(filters);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const suppliers = suppliersData?.suppliers || [];

  const supplierColumns = useMemo<ColumnDef<SupplierType>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Supplier Name",
        size: 200,
        minSize: 150,
        maxSize: 300,
        enableSorting: true,
        meta: { align: "left" },
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{row.original.name}</div>
            {row.original.contact_person && <div className="text-sm text-gray-500 dark:text-gray-400">{row.original.contact_person}</div>}
          </div>
        )
      },

      {
        id: "contact_person",
        accessorKey: "contact_person",
        header: "Contact Person",
        size: 140,
        minSize: 120,
        maxSize: 180,
        enableSorting: true,
        meta: { align: "left" },
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return value ? value : "Not Set";
        }
      },

      {
        id: "contact",
        accessorKey: "email",
        header: "Contact",
        size: 180,
        minSize: 150,
        maxSize: 250,
        enableSorting: true,
        meta: { align: "left" },
        cell: ({ row }) => (
          <div>
            {row.original.email && <div className="text-sm text-gray-900 dark:text-gray-100">{row.original.email}</div>}
            {row.original.phone && <div className="text-sm text-gray-500 dark:text-gray-400">{row.original.phone}</div>}
          </div>
        )
      },

      {
        id: "status",
        accessorKey: "is_active",
        header: "Status",
        size: 100,
        minSize: 80,
        maxSize: 120,
        enableSorting: true,
        meta: { align: "center" },
        cell: ({ getValue }) => {
          const isActive = getValue() as boolean;
          return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200"}`}>{isActive ? "Active" : "Inactive"}</span>;
        }
      },
      {
        id: "actions",
        header: "Actions",
        size: 150,
        minSize: 120,
        maxSize: 180,
        meta: { align: "center" },
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={e => {
                e.stopPropagation();
                setSelectedSupplier(row.original);
                setShowEditModal(true);
              }}
            >
              Edit
            </Button>
          </div>
        )
      }
    ],
    []
  );

  const handleCreateSupplier = async (data: CreateSupplierRequest) => {
    try {
      await createSupplier.mutateAsync(data);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create supplier:", error);
    }
  };

  const handleUpdateSupplier = async (data: CreateSupplierRequest) => {
    if (!selectedSupplier) return;

    try {
      await updateSupplier.mutateAsync({ id: selectedSupplier.id, data });
      setShowEditModal(false);
      setSelectedSupplier(null);
    } catch (error) {
      console.error("Failed to update supplier:", error);
    }
  };

  const renderListView = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Suppliers</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage suppliers and track performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            + Add Supplier
          </Button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:shadow-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        ) : (
          <Table
            data={suppliers}
            columns={supplierColumns}
            emptyMessage="No suppliers found"
            enableColumnResizing={true}
            enableSorting={true}
            maxHeight="600px"
            stickyHeader={true}
            onRowClick={supplier => {
              setSelectedSupplier(supplier);
            }}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      {renderListView()}

      {/* Create Supplier Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Supplier" size="lg">
        <div className="p-6">
          <SupplierForm onSubmit={handleCreateSupplier} onCancel={() => setShowCreateModal(false)} isLoading={createSupplier.isPending} />
        </div>
      </Modal>

      {/* Edit Supplier Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSupplier(null);
        }}
        title={`Edit ${selectedSupplier?.name}`}
        size="lg"
      >
        <div className="p-6">
          <SupplierForm
            supplier={selectedSupplier}
            onSubmit={handleUpdateSupplier}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedSupplier(null);
            }}
            isLoading={updateSupplier.isPending}
          />
        </div>
      </Modal>
    </>
  );
};

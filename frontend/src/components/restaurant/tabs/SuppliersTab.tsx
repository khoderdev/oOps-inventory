import type { ColumnDef } from "@tanstack/react-table";
import React, { useMemo, useState } from "react";
import { useCreateSupplier, useSupplierAnalytics, useSuppliers, useUpdateSupplier } from "../../../hooks/useSuppliers";
import type { CreateSupplierRequest, SupplierFilters, SupplierType } from "../../../types";
import { getSupplierGrade, SupplierGrades } from "../../../types/suppliers.types";
import { formatCurrency } from "../../../utils/quantity";
import { SupplierForm } from "../../forms/SupplierForm";
import { Button, Modal, Table } from "../../ui";

interface TopSupplierData {
  name: string;
  rating?: number;
  orderCount: number;
  totalValue: number;
  avgOrderValue: number;
}

export const SuppliersTab: React.FC = () => {
  const [filters, setFilters] = useState<SupplierFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierType | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "analytics" | "performance">("list");
  const { data: suppliersData, isLoading } = useSuppliers(filters);
  const { data: analytics } = useSupplierAnalytics(30);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const suppliers = suppliersData?.suppliers || [];

  // Define columns for top suppliers table
  const topSuppliersColumns = useMemo<ColumnDef<TopSupplierData>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Supplier",
        size: 200,
        minSize: 150,
        maxSize: 300,
        enableSorting: true,
        meta: { align: "left" }
      },
      {
        id: "rating",
        accessorKey: "rating",
        header: "Rating",
        size: 150,
        minSize: 120,
        maxSize: 200,
        enableSorting: true,
        meta: { align: "center" },
        cell: ({ getValue }) => {
          const rating = getValue() as number;
          return rating ? renderSupplierGrade(rating) : "Not Rated";
        }
      },
      {
        id: "orderCount",
        accessorKey: "orderCount",
        header: "Orders",
        size: 100,
        minSize: 80,
        maxSize: 120,
        enableSorting: true,
        meta: { align: "center" }
      },
      {
        id: "totalValue",
        accessorKey: "totalValue",
        header: "Total Value",
        size: 130,
        minSize: 100,
        maxSize: 160,
        enableSorting: true,
        meta: { align: "right" },
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return formatCurrency(value);
        }
      },
      {
        id: "avgOrderValue",
        accessorKey: "avgOrderValue",
        header: "Avg Order Value",
        size: 140,
        minSize: 120,
        maxSize: 180,
        enableSorting: true,
        meta: { align: "right" },
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return formatCurrency(value);
        }
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

  const renderSupplierGrade = (rating: number) => {
    const grade = getSupplierGrade(rating);
    const gradeInfo = SupplierGrades[grade];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gradeInfo.color}`}>
        Grade {grade} - {gradeInfo.label}
      </span>
    );
  };

  const renderListView = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Suppliers</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage suppliers and track performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode("analytics")}>
            📊 Analytics
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode("performance")}>
            🎯 Performance
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            + Add Supplier
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Status</label>
            <select
              value={filters.is_active === undefined ? "" : filters.is_active.toString()}
              onChange={e =>
                setFilters({
                  ...filters,
                  is_active: e.target.value === "" ? undefined : e.target.value === "true"
                })
              }
              className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            >
              <option value="">All Suppliers</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Search</label>
            <input type="text" value={filters.search || ""} onChange={e => setFilters({ ...filters, search: e.target.value || undefined })} placeholder="Search suppliers..." className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500" />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => setFilters({})} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:shadow-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Terms</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No suppliers found
                    </td>
                  </tr>
                ) : (
                  suppliers.map(supplier => (
                    <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{supplier.name}</div>
                          {supplier.contact_person && <div className="text-sm text-gray-500 dark:text-gray-400">{supplier.contact_person}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {supplier.email && <div className="text-sm text-gray-900 dark:text-gray-100">{supplier.email}</div>}
                          {supplier.phone && <div className="text-sm text-gray-500 dark:text-gray-400">{supplier.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{supplier.rating ? renderSupplierGrade(supplier.rating) : "Not Rated"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{supplier.payment_terms} days</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{supplier.lead_time_days} days</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{supplier.credit_limit ? formatCurrency(supplier.credit_limit) : "Not Set"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${supplier.is_active ? "bg-green-100 text-green-800 dark:text-green-200" : "bg-red-100 text-red-800 dark:text-red-200"}`}>{supplier.is_active ? "Active" : "Inactive"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setShowEditModal(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Supplier Analytics</h3>
        <Button variant="outline" onClick={() => setViewMode("list")}>
          ← Back to List
        </Button>
      </div>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg dark:bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm">🏭</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Suppliers</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{analytics.summary.totalSuppliers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Suppliers</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{analytics.summary.activeSuppliers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 dark:bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(analytics.summary.totalSpent)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 dark:bg-yellow-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">⭐</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Rating</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{analytics.summary.averageRating.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Suppliers */}
          <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Top Performing Suppliers</h4>
            </div>
            <div className="p-6">
              <Table columns={topSuppliersColumns} data={analytics.topSuppliers} enableColumnResizing={true} enableSorting={true} maxHeight="400px" />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderPerformanceView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Supplier Performance</h3>
        <Button variant="outline" onClick={() => setViewMode("list")}>
          ← Back to List
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Performance Tracking</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
              <p>Monitor supplier performance including delivery times, quality scores, and reliability metrics. Use this data to optimize your supplier relationships and negotiate better terms.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.slice(0, 6).map(supplier => (
          <div key={supplier.id} className="bg-white rounded-lg border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">{supplier.name}</h4>
              {supplier.rating && renderSupplierGrade(supplier.rating)}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Payment Terms</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{supplier.payment_terms} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Lead Time</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{supplier.lead_time_days} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Credit Limit</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{supplier.credit_limit ? formatCurrency(supplier.credit_limit) : "Not Set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Discount Rate</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{supplier.discount_rate ? `${supplier.discount_rate}%` : "None"}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button size="sm" variant="outline" className="w-full">
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case "analytics":
        return renderAnalyticsView();
      case "performance":
        return renderPerformanceView();
      default:
        return renderListView();
    }
  };

  return (
    <>
      {renderContent()}

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

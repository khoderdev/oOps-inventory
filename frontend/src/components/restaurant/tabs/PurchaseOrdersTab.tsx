import React, { useState } from "react";
import { usePurchaseOrderAnalytics, usePurchaseOrders, useReorderSuggestions } from "../../../hooks/usePurchaseOrders";
import { useRawMaterials } from "../../../hooks/useRawMaterials";
import { useSuppliers } from "../../../hooks/useSuppliers";
import type { PurchaseOrder, PurchaseOrderFilters, PurchaseOrderStatus, ReorderSuggestion } from "../../../types";
import { PurchaseOrderStatusColors, PurchaseOrderStatusLabels } from "../../../types";
import { formatCurrency } from "../../../utils/quantity";
import { PurchaseOrderForm } from "../../forms/PurchaseOrderForm";
import { ReceiveGoodsModal } from "../../modals/ReceiveGoodsModal";
import { Button, Modal } from "../../ui";

// Custom Table component for the specific interface used in this component
interface TableColumn {
  header: string;
  accessor: string;
  cell?: (value: unknown, row: unknown) => React.ReactNode;
}

interface CustomTableProps {
  columns: TableColumn[];
  data: unknown[];
}

const CustomTable: React.FC<CustomTableProps> = ({ columns, data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {columns.map(column => (
              <th key={column.accessor} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-100">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map(column => (
                <td key={column.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {column.cell ? column.cell(row[column.accessor], row as unknown as Record<string, unknown>) : String(row[column.accessor] || "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const PurchaseOrdersTab: React.FC = () => {
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "analytics" | "reorder">("list");

  const { data: purchaseOrders, isLoading } = usePurchaseOrders(filters);
  const { data: analytics } = usePurchaseOrderAnalytics(30);
  const { data: reorderSuggestions } = useReorderSuggestions();
  const { data: suppliersData } = useSuppliers({ is_active: true });
  const { data: rawMaterials } = useRawMaterials();

  const suppliers = suppliersData?.suppliers || [];

  const renderStatusBadge = (status: PurchaseOrderStatus) => {
    const colors = PurchaseOrderStatusColors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    const label = PurchaseOrderStatusLabels[status] || status;

    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors}`}>{label}</span>;
  };

  const renderListView = () => (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Purchase Orders</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage purchase orders and supplier workflows</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode("analytics")}>
            📊 Analytics
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode("reorder")}>
            🔄 Reorder Suggestions
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            + Create Purchase Order
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-100">Status</label>
            <select value={filters.status || ""} onChange={e => setFilters({ ...filters, status: (e.target.value as PurchaseOrderStatus) || undefined })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">All Statuses</option>
              {Object.entries(PurchaseOrderStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-100">Supplier</label>
            <select value={filters.supplier_id || ""} onChange={e => setFilters({ ...filters, supplier_id: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:ring-gray-700">
              <option value="">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => setFilters({})} className="w-full dark:text-gray-100">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        ) : (
          <CustomTable
            columns={[
              {
                header: "PO Number",
                accessor: "po_number",
                cell: (value: unknown) => <span className="font-medium text-gray-900 dark:text-gray-100">{String(value)}</span>
              },
              {
                header: "Supplier",
                accessor: "supplier",
                cell: (supplier: unknown) => {
                  const supplierObj = supplier as { name: string } | undefined;
                  return supplierObj?.name || "N/A";
                }
              },
              {
                header: "Status",
                accessor: "status",
                cell: (status: unknown) => renderStatusBadge(status as PurchaseOrderStatus)
              },
              {
                header: "Order Date",
                accessor: "order_date",
                cell: (date: unknown) => new Date(String(date)).toLocaleDateString()
              },
              {
                header: "Expected Date",
                accessor: "expected_date",
                cell: (date: unknown) => new Date(String(date)).toLocaleDateString()
              },
              {
                header: "Total Amount",
                accessor: "total_amount",
                cell: (amount: unknown) => formatCurrency(Number(amount))
              },
              {
                header: "Items",
                accessor: "order_items",
                cell: (items: unknown) => {
                  const itemsArray = items as PurchaseOrder["order_items"];
                  return `${itemsArray?.length || 0} items`;
                }
              },
              {
                header: "Actions",
                accessor: "id",
                cell: (value: unknown, row: unknown) => {
                  const purchaseOrder = row as PurchaseOrder;
                  return (
                    <div className="flex space-x-2">
                      {purchaseOrder.status === "PENDING_APPROVAL" && (
                        <Button size="sm" variant="outline">
                          Approve
                        </Button>
                      )}
                      {purchaseOrder.status === "APPROVED" && (
                        <Button size="sm" variant="outline">
                          Send
                        </Button>
                      )}
                      {(purchaseOrder.status === "SENT" || purchaseOrder.status === "PARTIALLY_RECEIVED") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(purchaseOrder);
                            setShowReceiveModal(true);
                          }}
                        >
                          Receive
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </div>
                  );
                }
              }
            ]}
            data={purchaseOrders?.orders || []}
          />
        )}
      </div>
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Purchase Order Analytics</h3>
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
                  <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm dark:text-gray-100">📋</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{analytics.summary.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm dark:text-gray-100">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(analytics.summary.totalValue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 dark:bg-yellow-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm dark:text-gray-100">⏳</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Orders</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{analytics.summary.pendingOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 dark:bg-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm dark:text-gray-100">🚨</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue Orders</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{analytics.summary.overdueOrders}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Suppliers */}
          <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Top Suppliers</h4>
            </div>
            <div className="p-6">
              <CustomTable
                columns={[
                  { header: "Supplier", accessor: "name" },
                  { header: "Orders", accessor: "orderCount" },
                  { header: "Total Value", accessor: "totalValue", cell: (value: unknown) => formatCurrency(Number(value)) },
                  { header: "Avg Order Value", accessor: "avgOrderValue", cell: (value: unknown) => formatCurrency(Number(value)) }
                ]}
                data={analytics.topSuppliers}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderReorderView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Reorder Suggestions</h3>
        <Button variant="outline" onClick={() => setViewMode("list")}>
          ← Back to List
        </Button>
      </div>

      {reorderSuggestions && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-800 dark:border-blue-700">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-100">
                  <strong>{reorderSuggestions.summary.totalItems} items</strong> need reordering.
                  <strong> {reorderSuggestions.summary.highUrgency} high priority</strong> items requiring immediate attention. Estimated total value: <strong>{formatCurrency(reorderSuggestions.summary.estimatedValue)}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <CustomTable
              columns={[
                { header: "Material", accessor: "name" },
                { header: "Category", accessor: "category" },
                {
                  header: "Current Stock",
                  accessor: "currentStock",
                  cell: (value: unknown) => `${Number(value)} units`
                },
                {
                  header: "Min Level",
                  accessor: "minStockLevel",
                  cell: (value: unknown) => `${Number(value)} units`
                },
                {
                  header: "Suggested Qty",
                  accessor: "suggestedQuantity",
                  cell: (value: unknown) => `${Number(value)} units`
                },
                {
                  header: "Days of Stock",
                  accessor: "daysOfStock",
                  cell: (value: unknown) => `${Number(value)} days`
                },
                {
                  header: "Urgency",
                  accessor: "urgency",
                  cell: (urgency: unknown) => {
                    const urgencyValue = urgency as ReorderSuggestion["urgency"];
                    const colors = {
                      HIGH: "bg-red-100 text-red-800",
                      MEDIUM: "bg-yellow-100 text-yellow-800",
                      LOW: "bg-green-100 text-green-800"
                    };
                    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[urgencyValue]}`}>{urgencyValue}</span>;
                  }
                },
                {
                  header: "Est. Cost",
                  accessor: "unitCost",
                  cell: (unitCost: unknown, row: unknown) => {
                    const suggestion = row as ReorderSuggestion;
                    return formatCurrency(Number(unitCost) * suggestion.suggestedQuantity);
                  }
                },
                {
                  header: "Actions",
                  accessor: "id",
                  cell: () => (
                    <Button
                      size="sm"
                      onClick={() => {
                        // Auto-fill create PO form with this material
                        setShowCreateModal(true);
                      }}
                    >
                      Create PO
                    </Button>
                  )
                }
              ]}
              data={reorderSuggestions.reorderSuggestions}
            />
          </div>
        </>
      )}
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case "analytics":
        return renderAnalyticsView();
      case "reorder":
        return renderReorderView();
      default:
        return renderListView();
    }
  };

  return (
    <>
      {renderContent()}

      {/* Create Purchase Order Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Purchase Order" size="lg">
        <PurchaseOrderForm
          suppliers={suppliers}
          rawMaterials={rawMaterials || []}
          onSuccess={() => {
            setShowCreateModal(false);
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Receive Goods Modal */}
      <Modal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} title="Receive Goods" size="lg">
        {selectedOrder && (
          <ReceiveGoodsModal
            purchaseOrder={selectedOrder}
            onSuccess={() => {
              setShowReceiveModal(false);
              setSelectedOrder(null);
            }}
            onCancel={() => {
              setShowReceiveModal(false);
              setSelectedOrder(null);
            }}
          />
        )}
      </Modal>
    </>
  );
};

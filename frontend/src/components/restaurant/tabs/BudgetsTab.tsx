/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useBudgetAnalytics, useBudgetRecommendations, useBudgets, useBudgetSpending, useBudgetVariance, useCreateBudget, useUpdateBudget } from "../../../hooks/useBudgets";
import type { Budget, BudgetFilters, BudgetPeriod, CreateBudgetRequest } from "../../../types";
import { BudgetPeriodLabels } from "../../../types";
import { formatCurrency } from "../../../utils/quantity";
import { BudgetForm } from "../../forms/BudgetForm";
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
              <th key={column.accessor} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                  {column.cell ? column.cell((row as Record<string, unknown>)[column.accessor], row as unknown as Record<string, unknown>) : String((row as Record<string, unknown>)[column.accessor] || "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const BudgetsTab: React.FC = () => {
  const [filters, setFilters] = useState<BudgetFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [viewMode, setViewMode] = useState<"budgets" | "analytics" | "variance">("budgets");

  const { data: budgetsData, isLoading } = useBudgets(filters);
  const { data: analytics } = useBudgetAnalytics();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  const budgets = budgetsData?.budgets || [];

  const handleCreateBudget = async (data: CreateBudgetRequest) => {
    try {
      await createBudget.mutateAsync(data);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create budget:", error);
    }
  };

  const handleUpdateBudget = async (data: CreateBudgetRequest) => {
    if (!selectedBudget) return;

    try {
      await updateBudget.mutateAsync({ id: selectedBudget.id, data });
      setShowEditModal(false);
      setSelectedBudget(null);
    } catch (error) {
      console.error("Failed to update budget:", error);
    }
  };

  const renderPeriodBadge = (period: BudgetPeriod) => {
    const label = BudgetPeriodLabels[period] || period;
    const colors = {
      WEEKLY: "bg-blue-100 text-blue-800 dark:text-blue-200",
      MONTHLY: "bg-green-100 text-green-800 dark:text-green-200",
      QUARTERLY: "bg-purple-100 text-purple-800 dark:text-purple-200",
      YEARLY: "bg-orange-100 text-orange-800 dark:text-orange-200"
    };

    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[period] || "bg-gray-100 text-gray-800 dark:text-gray-200"}`}>{label}</span>;
  };

  const renderStatusBadge = (isActive: boolean) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? "bg-green-100 text-green-800 dark:text-green-200" : "bg-red-100 text-red-800 dark:text-red-200"}`}>{isActive ? "Active" : "Inactive"}</span>;

  const renderBudgetsView = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Budget Planning</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage budgets and track spending performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode("analytics")}>
            📊 Analytics
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode("variance")}>
            📈 Variance Analysis
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            + Create Budget
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Period</label>
            <select value={filters.period_type || ""} onChange={e => setFilters({ ...filters, period_type: (e.target.value as BudgetPeriod) || undefined })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:focus:border-blue-500 dark:focus:ring-blue-500">
              <option value="">All Periods</option>
              {Object.entries(BudgetPeriodLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Status</label>
            <select
              value={filters.is_active === undefined ? "" : filters.is_active.toString()}
              onChange={e =>
                setFilters({
                  ...filters,
                  is_active: e.target.value === "" ? undefined : e.target.value === "true"
                })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            >
              <option value="">All Budgets</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => setFilters({})} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Budgets Table */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:shadow-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        ) : (
          <CustomTable
            columns={[
              {
                header: "Budget Name",
                accessor: "name",
                cell: (value: unknown, row: unknown) => {
                  const budget = row as Budget;
                  return (
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{String(value)}</div>
                      {budget.description && <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{budget.description}</div>}
                    </div>
                  );
                }
              },
              {
                header: "Period",
                accessor: "period_type",
                cell: (period: unknown) => renderPeriodBadge(period as BudgetPeriod)
              },
              {
                header: "Start Date",
                accessor: "start_date",
                cell: (date: unknown) => new Date(String(date)).toLocaleDateString()
              },
              {
                header: "End Date",
                accessor: "end_date",
                cell: (date: unknown) => new Date(String(date)).toLocaleDateString()
              },
              {
                header: "Total Budget",
                accessor: "total_budget",
                cell: (amount: unknown) => formatCurrency(Number(amount))
              },
              {
                header: "Spending",
                accessor: "id",
                cell: (id: unknown) => <BudgetSpendingCell budgetId={Number(id)} />
              },
              {
                header: "Status",
                accessor: "is_active",
                cell: (isActive: unknown) => renderStatusBadge(Boolean(isActive))
              },
              {
                header: "Actions",
                accessor: "actions",
                cell: (id: unknown, row: unknown) => {
                  const budget = row as Budget;
                  return (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBudget(budget);
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </div>
                  );
                }
              }
            ]}
            data={budgets}
          />
        )}
      </div>
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Budget Analytics</h3>
        <Button variant="outline" onClick={() => setViewMode("budgets")}>
          ← Back to Budgets
        </Button>
      </div>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center dark:bg-blue-400">
                    <span className="text-white text-sm">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Budgets</p>
                  <p className="text-2xl font-semibold text-gray-900">{Number((analytics as unknown as Record<string, unknown>)?.summary?.totalBudgets) || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Allocated</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(Number((analytics as unknown as Record<string, unknown>)?.summary?.totalAllocated) || 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">💸</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(Number((analytics as unknown as Record<string, unknown>)?.summary?.totalSpent) || 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(Number((analytics as unknown as Record<string, unknown>)?.summary?.utilizationRate) || 0) > 90 ? "bg-red-500" : (Number((analytics as unknown as Record<string, unknown>)?.summary?.utilizationRate) || 0) > 75 ? "bg-yellow-500" : "bg-green-500"}`}>
                    <span className="text-white text-sm">📈</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Utilization Rate</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{(Number((analytics as unknown as Record<string, unknown>)?.summary?.utilizationRate) || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Performance */}
          <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Budget Performance</h4>
            </div>
            <div className="p-6">
              <CustomTable
                columns={[
                  { header: "Budget", accessor: "name" },
                  { header: "Period", accessor: "period", cell: (period: unknown) => renderPeriodBadge(period as BudgetPeriod) },
                  { header: "Allocated", accessor: "allocated", cell: (value: unknown) => formatCurrency(Number(value)) },
                  { header: "Spent", accessor: "spent", cell: (value: unknown) => formatCurrency(Number(value)) },
                  {
                    header: "Utilization",
                    accessor: "utilization",
                    cell: (value: unknown) => {
                      const utilization = Number(value);
                      return <span className={`text-sm font-medium ${utilization > 100 ? "text-red-600 dark:text-red-400" : utilization > 90 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>{utilization.toFixed(1)}%</span>;
                    }
                  },
                  {
                    header: "Variance",
                    accessor: "variance",
                    cell: (value: unknown) => {
                      const variance = Number(value);
                      return (
                        <span className={`text-sm font-medium ${variance < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                          {variance > 0 ? "+" : ""}
                          {formatCurrency(variance)}
                        </span>
                      );
                    }
                  }
                ]}
                data={((analytics as unknown as Record<string, unknown>)?.budgetPerformance as unknown[]) || []}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderVarianceView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Variance Analysis</h3>
        <Button variant="outline" onClick={() => setViewMode("budgets")}>
          ← Back to Budgets
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-800 dark:border-blue-700">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Budget Variance Analysis</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
              <p>Track actual spending against budgeted amounts to identify trends, overspending areas, and optimization opportunities.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Variance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.slice(0, 6).map(budget => (
          <BudgetVarianceCard key={budget.id} budget={budget} />
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case "analytics":
        return renderAnalyticsView();
      case "variance":
        return renderVarianceView();
      default:
        return renderBudgetsView();
    }
  };

  return (
    <>
      {renderContent()}

      {/* Create Budget Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Budget" size="lg">
        <div className="p-6">
          <BudgetForm onSubmit={handleCreateBudget} onCancel={() => setShowCreateModal(false)} isLoading={createBudget.isPending} />
        </div>
      </Modal>

      {/* Edit Budget Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBudget(null);
        }}
        title={`Edit ${selectedBudget?.name}`}
        size="lg"
      >
        <div className="p-6">
          <BudgetForm
            budget={selectedBudget}
            onSubmit={handleUpdateBudget}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedBudget(null);
            }}
            isLoading={updateBudget.isPending}
          />
        </div>
      </Modal>
    </>
  );
};

// Helper Components
const BudgetSpendingCell: React.FC<{ budgetId: number }> = ({ budgetId }) => {
  const { data: spendingData, isLoading } = useBudgetSpending(budgetId);

  if (isLoading) {
    return <div className="animate-pulse w-16 h-4 bg-gray-200 rounded"></div>;
  }

  const utilizationRate = spendingData ? ((Number((spendingData as unknown as Record<string, unknown>)?.totalSpent) || 0) / (Number((spendingData as unknown as Record<string, unknown>)?.totalBudget) || 1)) * 100 : 0;

  return (
    <div className="text-sm">
      <div className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(Number((spendingData as unknown as Record<string, unknown>)?.totalSpent) || 0)}</div>
      <div className={`text-xs ${utilizationRate > 100 ? "text-red-600 dark:text-red-400" : utilizationRate > 90 ? "text-yellow-600 dark:text-yellow-400" : "text-gray-500 dark:text-gray-400"}`}>{utilizationRate.toFixed(1)}% used</div>
    </div>
  );
};

const BudgetVarianceCard: React.FC<{ budget: Budget }> = ({ budget }) => {
  const { data: varianceData } = useBudgetVariance(budget.id);
  const { data: recommendations } = useBudgetRecommendations(budget.id);

  const renderPeriodBadge = (period: BudgetPeriod) => {
    const label = BudgetPeriodLabels[period] || period;
    const colors = {
      WEEKLY: "bg-blue-100 text-blue-800",
      MONTHLY: "bg-green-100 text-green-800",
      QUARTERLY: "bg-purple-100 text-purple-800",
      YEARLY: "bg-orange-100 text-orange-800"
    };

    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[period] || "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}>{label}</span>;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">{budget.name}</h4>
        {renderPeriodBadge(budget.period_type)}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Budget</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(budget.total_budget)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Spent</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency((varianceData as any)?.totalSpent || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Remaining</span>
          <span className={`text-sm font-medium ${((varianceData as any)?.totalSpent || 0) > budget.total_budget ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>{formatCurrency(budget.total_budget - ((varianceData as any)?.totalSpent || 0))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Utilization</span>
          <span className={`text-sm font-medium ${((varianceData as any)?.utilizationRate || 0) > 100 ? "text-red-600 dark:text-red-400" : ((varianceData as any)?.utilizationRate || 0) > 90 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>{((varianceData as any)?.utilizationRate || 0).toFixed(1)}%</span>
        </div>
      </div>

      {recommendations && Array.isArray(recommendations) && recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Top Recommendation</h5>
          <p className="text-xs text-gray-600 dark:text-gray-400">{(recommendations as any)[0]?.recommendation}</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button size="sm" variant="outline" className="w-full">
          View Details
        </Button>
      </div>
    </div>
  );
};

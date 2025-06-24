import { DollarSign, Package, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";
import type { RawMaterial, StockEntry } from "../../types";

interface ExpenseReportProps {
  stockEntries: StockEntry[];
  rawMaterials: RawMaterial[];
  expenseBreakdown: {
    purchases: Record<string, number>;
    totalPurchases: number;
    averageOrderValue: number;
    topSuppliers: Array<{ name: string; total: number }>;
  };
  dateRange: number;
}

const ExpenseReport = ({ stockEntries, rawMaterials, expenseBreakdown, dateRange }: ExpenseReportProps) => {
  const expenseData = useMemo(() => {
    // Monthly trend (simplified - last 4 periods)
    const periods = [];
    for (let i = 3; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - (i * dateRange) / 4);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - dateRange / 4);

      const periodEntries = stockEntries.filter(entry => {
        const entryDate = new Date(entry.receivedDate);
        return entryDate >= startDate && entryDate <= endDate;
      });

      periods.push({
        period: `Period ${4 - i}`,
        total: periodEntries.reduce((sum, entry) => sum + entry.totalCost, 0),
        count: periodEntries.length
      });
    }

    // Cost per unit analysis
    const materialCosts = rawMaterials
      .map(material => {
        const materialEntries = stockEntries.filter(entry => entry.rawMaterialId === material.id);
        const totalCost = materialEntries.reduce((sum, entry) => sum + entry.totalCost, 0);
        const totalQuantity = materialEntries.reduce((sum, entry) => sum + entry.quantity, 0);
        const avgUnitCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

        return {
          material,
          totalCost,
          totalQuantity,
          avgUnitCost,
          entryCount: materialEntries.length,
          lastPurchase: materialEntries.length > 0 ? new Date(Math.max(...materialEntries.map(e => new Date(e.receivedDate).getTime()))) : null
        };
      })
      .filter(item => item.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost);

    // Supplier analysis
    const supplierAnalysis = expenseBreakdown.topSuppliers.map(supplier => {
      const supplierEntries = stockEntries.filter(entry => entry.supplier === supplier.name);
      const avgOrderValue = supplierEntries.length > 0 ? supplier.total / supplierEntries.length : 0;
      const uniqueMaterials = new Set(supplierEntries.map(e => e.rawMaterialId)).size;

      return {
        ...supplier,
        orderCount: supplierEntries.length,
        avgOrderValue,
        uniqueMaterials,
        lastOrder: supplierEntries.length > 0 ? new Date(Math.max(...supplierEntries.map(e => new Date(e.receivedDate).getTime()))) : null
      };
    });

    return {
      periods,
      materialCosts,
      supplierAnalysis,
      totalEntries: stockEntries.length,
      totalValue: expenseBreakdown.totalPurchases
    };
  }, [stockEntries, rawMaterials, expenseBreakdown, dateRange]);

  const categoryData = Object.entries(expenseBreakdown.purchases)
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Purchases</p>
              <p className="text-2xl font-bold text-green-900">${expenseBreakdown.totalPurchases.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Average Order Value</p>
              <p className="text-2xl font-bold text-blue-900">${expenseBreakdown.averageOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Total Orders</p>
              <p className="text-2xl font-bold text-purple-900">{expenseData.totalEntries}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Active Suppliers</p>
              <p className="text-2xl font-bold text-yellow-900">{expenseBreakdown.topSuppliers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses by Category</h3>
          <div className="space-y-4">
            {categoryData.map(({ category, value }) => {
              const percentage = expenseBreakdown.totalPurchases > 0 ? (value / expenseBreakdown.totalPurchases) * 100 : 0;

              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 capitalize">{category.replace("_", " ")}</span>
                    <span className="text-sm font-bold text-gray-900">
                      ${value.toFixed(2)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spending Trend */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Spending Trend</h3>
          <div className="space-y-4">
            {expenseData.periods.map((period, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{period.period}</p>
                  <p className="text-sm text-gray-600">{period.count} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${period.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Avg: ${period.count > 0 ? (period.total / period.count).toFixed(2) : "0.00"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Suppliers */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Suppliers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materials</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Order</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenseData.supplierAnalysis.map((supplier, index) => (
                <tr key={supplier.name}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">#{index + 1}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${supplier.total.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.orderCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${supplier.avgOrderValue.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.uniqueMaterials}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.lastOrder ? supplier.lastOrder.toLocaleDateString() : "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Cost Analysis */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Material Cost Analysis</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Unit Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Purchase</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenseData.materialCosts.slice(0, 15).map(item => (
                <tr key={item.material.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.material.name}</div>
                    <div className="text-sm text-gray-500">{item.material.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.totalCost.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.totalQuantity} {item.material.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.avgUnitCost.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.entryCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lastPurchase ? item.lastPurchase.toLocaleDateString() : "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseReport;

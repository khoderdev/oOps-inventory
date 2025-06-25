import { AlertTriangle, Package } from "lucide-react";
import type { StockLevel } from "../../types";

interface LowStockReportProps {
  stockLevels: StockLevel[];
}

const LowStockReport = ({ stockLevels }: LowStockReportProps) => {
  const lowStockItems = stockLevels.filter(level => level.isLowStock);
  const criticalItems = lowStockItems.filter(level => level.availableQuantity <= 0);
  const warningItems = lowStockItems.filter(level => level.availableQuantity > 0 && level.availableQuantity <= level.minLevel * 0.5);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 dark:bg-red-900/10 dark:border-red-700">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Critical (Out of Stock)</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">{criticalItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-700">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Warning (Very Low)</p>
              <p className="text-2xl font-bold text-yellow-900">{warningItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 dark:bg-blue-900/10 dark:border-blue-700">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Low Stock</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{lowStockItems.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Items */}
      {criticalItems.length > 0 && (
        <div className="bg-white rounded-lg border border-red-200 dark:bg-red-900/10 dark:border-red-700">
          <div className="px-6 py-4 border-b border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-700">
            <h3 className="text-lg font-medium text-red-900 dark:text-red-300 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Critical - Out of Stock
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {criticalItems.map(item => (
                <div key={item.rawMaterialId} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.rawMaterial?.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Category: {item.rawMaterial?.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600 font-medium dark:text-red-400">OUT OF STOCK</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Min: {item.minLevel} {item.rawMaterial?.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Warning Items */}
      {warningItems.length > 0 && (
        <div className="bg-white rounded-lg border border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-700">
          <div className="px-6 py-4 border-b border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-700">
            <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-300 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Warning - Very Low Stock
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {warningItems.map(item => (
                <div key={item.rawMaterialId} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.rawMaterial?.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Category: {item.rawMaterial?.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-yellow-600 font-medium dark:text-yellow-400">
                      {item.availableQuantity} {item.rawMaterial?.unit}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Min: {item.minLevel} {item.rawMaterial?.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {lowStockItems.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border">
          <Package className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Stock Levels Good!</h3>
          <p className="text-gray-600 dark:text-gray-400">No items are currently below their minimum stock levels</p>
        </div>
      )}
    </div>
  );
};

export default LowStockReport;

import { BarChart3 } from "lucide-react";

interface StockValueChartProps {
  data: Record<string, number>;
}

const StockValueChart = ({ data }: StockValueChartProps) => {
  const entries = Object.entries(data);
  const maxValue = Math.max(...entries.map(([, value]) => value));

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Inventory Value by Category</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Inventory Value by Category</h3>
      </div>

      <div className="space-y-4">
        {entries.map(([category, value]) => (
          <div key={category} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{category.replace("_", " ")}</span>
              <span className="text-sm text-gray-900 dark:text-white">${value.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockValueChart;

import { PieChart } from "lucide-react";

interface CategoryBreakdownProps {
  data: Record<string, number>;
}

const CategoryBreakdown = ({ data }: CategoryBreakdownProps) => {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-gray-500"];

  if (entries.length === 0 || total === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center space-x-2 mb-4">
          <PieChart className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Category Breakdown</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex items-center space-x-2 mb-4">
        <PieChart className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">Category Breakdown</h3>
      </div>

      <div className="space-y-3">
        {entries.map(([category, value], index) => {
          const percentage = ((value / total) * 100).toFixed(1);
          const colorClass = colors[index % colors.length];

          return (
            <div key={category} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                <span className="text-sm font-medium text-gray-700 capitalize">{category.replace("_", " ")}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{percentage}%</div>
                <div className="text-xs text-gray-500">${value.toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Value</span>
          <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default CategoryBreakdown;

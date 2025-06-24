import { Package, Warehouse, Building2, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { useRawMaterials } from "../../hooks/useRawMaterials";
import { useStockLevels } from "../../hooks/useStock";
import { useSections } from "../../hooks/useSections";

const DashboardPage = () => {
  const { data: rawMaterials = [] } = useRawMaterials({ isActive: true });
  const { data: stockLevels = [] } = useStockLevels();
  const { data: sections = [] } = useSections({ isActive: true });

  const lowStockItems = stockLevels.filter(level => level.isLowStock);
  const totalValue = stockLevels.reduce((sum, level) => sum + level.availableQuantity * (level.rawMaterial?.unitCost || 0), 0);

  const stats = [
    {
      name: "Total Raw Materials",
      value: rawMaterials.length,
      icon: Package,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      name: "Active Sections",
      value: sections.length,
      icon: Building2,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      name: "Low Stock Alerts",
      value: lowStockItems.length,
      icon: AlertTriangle,
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      name: "Total Inventory Value",
      value: `$${totalValue.toFixed(2)}`,
      icon: TrendingUp,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your restaurant inventory management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No low stock alerts</p>
          ) : (
            <div className="space-y-3">
              {lowStockItems.slice(0, 5).map(item => (
                <div key={item.rawMaterialId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.rawMaterial?.name}</p>
                    <p className="text-sm text-gray-600">
                      Current: {item.availableQuantity} {item.rawMaterial?.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600 font-medium">Low Stock</p>
                    <p className="text-xs text-gray-500">
                      Min: {item.minLevel} {item.rawMaterial?.unit}
                    </p>
                  </div>
                </div>
              ))}
              {lowStockItems.length > 5 && <p className="text-sm text-gray-500 text-center pt-2">+{lowStockItems.length - 5} more items</p>}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Warehouse className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">System Initialized</p>
                <p className="text-sm text-gray-600">Welcome to Inventory Pro</p>
              </div>
              <span className="text-xs text-gray-500">Just now</span>
            </div>
            <div className="text-center py-8 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Activity will appear here as you use the system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Package className="w-6 h-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Add Raw Material</h4>
            <p className="text-sm text-gray-600">Add new ingredients to your inventory</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Warehouse className="w-6 h-6 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Record Stock</h4>
            <p className="text-sm text-gray-600">Add new stock to your inventory</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Building2 className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">Create Section</h4>
            <p className="text-sm text-gray-600">Set up new kitchen or bar sections</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

import { AlertTriangle, Building2, Package, TrendingUp, Users, Warehouse } from "lucide-react";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
import { useRawMaterials } from "../../hooks/useRawMaterials";
import { useSections } from "../../hooks/useSections";
import { useStockLevels } from "../../hooks/useStock";
import type { User } from "../../types";
import { formatQuantityDisplay } from "../../utils/quantity";
import RawMaterialForm from "../rawMaterials/RawMaterialForm";
import SectionForm from "../sections/SectionForm";
import StockEntryForm from "../stock/StockEntryForm";
import Modal from "../ui/Modal";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { data: rawMaterials = [] } = useRawMaterials({ isActive: true });
  const { data: stockLevels = [] } = useStockLevels();
  const { data: sections = [] } = useSections({ isActive: true });

  // Quick Actions Modal States
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);

  const {
    state: { user }
  } = useContext(AppContext) as { state: { user: User } };

  const lowStockItems = stockLevels.filter(level => level.isLowStock);
  const totalValue = stockLevels.reduce((sum, level) => sum + level.availableUnitsQuantity * (level.rawMaterial?.unitCost || 0), 0);

  const stats = [
    {
      name: "Total Raw Materials",
      value: rawMaterials.length,
      icon: Package,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      name: "Active Sections",
      value: sections.length,
      icon: Building2,
      color: "bg-green-500",
      textColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      name: "Low Stock Alerts",
      value: lowStockItems.length,
      icon: AlertTriangle,
      color: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20"
    },
    {
      name: "Total Inventory Value",
      value: `$${totalValue.toFixed(2)}`,
      icon: TrendingUp,
      color: "bg-purple-500",
      textColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    }
  ];

  // Navigation handlers
  const handleMaterialSuccess = () => {
    setShowAddMaterialModal(false);
    navigate("/raw-materials");
  };

  const handleStockSuccess = () => {
    setShowAddStockModal(false);
    navigate("/stock");
  };

  const handleSectionSuccess = () => {
    setShowCreateSectionModal(false);
    navigate("/sections");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => setShowAddMaterialModal(true)} disabled={!(user?.role === "MANAGER" || user?.role === "ADMIN")} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">Add Raw Material</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add new ingredients to your inventory</p>
          </button>
          <button onClick={() => setShowAddStockModal(true)} disabled={!(user?.role === "MANAGER" || user?.role === "ADMIN")} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            <Warehouse className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">Record Stock</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add new stock to your inventory</p>
          </button>
          <button onClick={() => setShowCreateSectionModal(true)} disabled={!(user?.role === "MANAGER" || user?.role === "ADMIN")} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">Create Section</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Set up new kitchen or bar sections</p>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/*  Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Alerts</h3>
            <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No low stock alerts</p>
          ) : (
            <div className="space-y-3">
              {lowStockItems.slice(0, 5).map(item => (
                <div key={item.rawMaterial?.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.rawMaterial?.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current: {formatQuantityDisplay(item.availableUnitsQuantity, item.rawMaterial)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">Low Stock</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Min: {formatQuantityDisplay(item.minLevel, item.rawMaterial)}</p>
                  </div>
                </div>
              ))}
              {lowStockItems.length > 5 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">+{lowStockItems.length - 5} more items</p>}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <Warehouse className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">System Initialized</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Welcome to oOps Inventory System</p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Just now</span>
            </div>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Activity will appear here as you use the system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Modals */}
      <Modal isOpen={showAddMaterialModal} onClose={() => setShowAddMaterialModal(false)} title="Add Raw Material" size="lg">
        <RawMaterialForm onSuccess={handleMaterialSuccess} onCancel={() => setShowAddMaterialModal(false)} />
      </Modal>

      <Modal isOpen={showAddStockModal} onClose={() => setShowAddStockModal(false)} title="Add Stock Entry" size="lg">
        <StockEntryForm onSuccess={handleStockSuccess} onCancel={() => setShowAddStockModal(false)} />
      </Modal>

      <Modal isOpen={showCreateSectionModal} onClose={() => setShowCreateSectionModal(false)} title="Create New Section" size="lg">
        <SectionForm onSuccess={handleSectionSuccess} onCancel={() => setShowCreateSectionModal(false)} />
      </Modal>
    </div>
  );
};

export default DashboardPage;

import { Activity, Package, Plus, TrendingUp } from "lucide-react";
import { useContext, useState } from "react";
import { AppContext } from "../../contexts/AppContext";
import type { User } from "../../types";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import StockEntriesTab from "./StockEntriesTab";
import StockEntryForm from "./StockEntryForm";
import StockLevelsTab from "./StockLevelsTab";
import StockMovementsTab from "./StockMovementsTab";

type TabType = "entries" | "movements" | "levels";

const StockManagementPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("levels");
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const {
    state: { user }
  } = useContext(AppContext) as { state: { user: User } };
  const tabs = [
    { id: "levels" as TabType, label: "Stock Levels", icon: TrendingUp },
    { id: "entries" as TabType, label: "Stock Entries", icon: Package },
    { id: "movements" as TabType, label: "Movements", icon: Activity }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "entries":
        return <StockEntriesTab />;
      case "movements":
        return <StockMovementsTab />;
      case "levels":
        return <StockLevelsTab />;
      default:
        return <StockLevelsTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track inventory levels, entries, and movements</p>
        </div>
        {user?.role === "MANAGER" || user?.role === "ADMIN" ? (
          <Button onClick={() => setShowAddStockModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add Stock Entry
          </Button>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300"}`}>
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">{renderTabContent()}</div>
      </div>

      {/* Add Stock Modal */}
      <Modal isOpen={showAddStockModal} onClose={() => setShowAddStockModal(false)} title="Add Stock Entry" size="lg">
        <StockEntryForm
          onSuccess={() => {
            setShowAddStockModal(false);
          }}
          onCancel={() => setShowAddStockModal(false)}
        />
      </Modal>
    </div>
  );
};

export default StockManagementPage;

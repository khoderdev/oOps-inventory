import { Activity, Package, PlusIcon, TrendingUp } from "lucide-react";
import { useContext, useState } from "react";
import { AppContext } from "../../contexts/AppContext";
import useFloatingButtonVisibility from "../../hooks/useFloatingButtonVisibility";
import type { User } from "../../types";
import { Tabs, type Tab } from "../ui";
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

  const tabs: Tab<TabType>[] = [
    { id: "levels", label: "Stock Levels", icon: TrendingUp },
    { id: "entries", label: "Stock Entries", icon: Package },
    { id: "movements", label: "Movements", icon: Activity }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "entries":
        return <StockEntriesTab />;
      case "movements":
        return <StockMovementsTab />;
      case "levels":
      default:
        return <StockLevelsTab />;
    }
  };

  const floating = true;

  const { visible: isVisible } = useFloatingButtonVisibility({
    minScrollDistance: 200,
    showOnTop: true
  });

  return (
    <div className="space-y-6">
      <>
        {(user?.role === "MANAGER" || user?.role === "ADMIN") && (!floating || isVisible) && (
          <Button floating={floating} animationType="scale" threshold={15} autoHideDelay={500} minScrollDistance={200} variant="primary" leftIcon={<PlusIcon />} onClick={() => setShowAddStockModal(true)}>
            Add Stock Entry
          </Button>
        )}
      </>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} variant="default" size="md" className="px-6" />
        <div className="p-6" role="tabpanel" id={`tabpanel-${activeTab}`}>
          {renderTabContent()}
        </div>
      </div>

      <Modal isOpen={showAddStockModal} onClose={() => setShowAddStockModal(false)} title="Add Stock Entry" size="lg">
        <StockEntryForm onSuccess={() => setShowAddStockModal(false)} onCancel={() => setShowAddStockModal(false)} />
      </Modal>
    </div>
  );
};

export default StockManagementPage;

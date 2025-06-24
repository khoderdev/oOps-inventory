import { Minus, Package, Plus } from "lucide-react";
import { useState } from "react";
import { useSectionInventory } from "../../hooks/useSections";
import type { Section, SectionInventory } from "../../types";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConsumptionModal from "./ConsumptionModal";
import StockAssignmentModal from "./StockAssignmentModal";

interface SectionDetailsModalProps {
  section: Section | null;
  isOpen: boolean;
  onClose: () => void;
}

const SectionDetailsModal = ({ section, isOpen, onClose }: SectionDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<"inventory" | "consumption">("inventory");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<SectionInventory | null>(null);

  const { data: inventory = [], refetch } = useSectionInventory(section?.id || "");

  if (!section) return null;

  const tabs = [
    { id: "inventory" as const, label: "Current Inventory" },
    { id: "consumption" as const, label: "Consumption History" }
  ];

  const handleAssignSuccess = () => {
    refetch(); // Refresh the inventory data
    setShowAssignModal(false);
  };

  const handleUseClick = (item: SectionInventory) => {
    setSelectedInventoryItem(item);
    setShowConsumptionModal(true);
  };

  const handleConsumptionSuccess = () => {
    refetch(); // Refresh the inventory data
    setShowConsumptionModal(false);
    setSelectedInventoryItem(null);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`${section.name} - Details`} size="xl">
        <div className="space-y-6">
          {/* Section Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Type</p>
                <p className="text-lg text-gray-900 capitalize">{section.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Manager</p>
                <p className="text-lg text-gray-900">{section.managerId}</p>
              </div>
            </div>
            {section.description && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600">Description</p>
                <p className="text-gray-900">{section.description}</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "inventory" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Current Inventory</h3>
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAssignModal(true)}>
                  Assign Stock
                </Button>
              </div>

              {inventory.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No inventory assigned to this section</p>
                  <p className="text-sm text-gray-500 mt-2">Click "Assign Stock" to add materials to this section</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inventory.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.rawMaterial?.name}</p>
                        <p className="text-sm text-gray-500">Category: {item.rawMaterial?.category}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {item.quantity} {item.rawMaterial?.unit}
                          </p>
                          <p className="text-sm text-gray-500">Available</p>
                          {item.reservedQuantity > 0 && <p className="text-xs text-yellow-600">{item.reservedQuantity} reserved</p>}
                        </div>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" leftIcon={<Minus className="w-3 h-3" />} disabled={item.quantity <= 0} onClick={() => handleUseClick(item)} title="Record consumption">
                            Use
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "consumption" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Consumption History</h3>
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No consumption data available</p>
                <p className="text-sm text-gray-500">Usage will appear here as items are consumed</p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Stock Assignment Modal */}
      <StockAssignmentModal section={section} isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} onSuccess={handleAssignSuccess} />

      {/* Consumption Modal */}
      {selectedInventoryItem && (
        <ConsumptionModal
          section={section}
          inventoryItem={selectedInventoryItem}
          isOpen={showConsumptionModal}
          onClose={() => {
            setShowConsumptionModal(false);
            setSelectedInventoryItem(null);
          }}
          onSuccess={handleConsumptionSuccess}
        />
      )}
    </>
  );
};

export default SectionDetailsModal;

import { Minus, Package, Plus } from "lucide-react";
import { useState } from "react";
import { useSectionConsumption, useSectionInventory } from "../../hooks/useSections";
import type { RawMaterial, Section, SectionDetailsModalProps, SectionInventory } from "../../types";
import { MeasurementUnit } from "../../types";
import { splitQuantityAndUnit } from "../../utils/units";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConsumptionModal from "./ConsumptionModal";
import SectionInventoryEditModal from "./SectionInventoryEditModal";
import StockAssignmentModal from "./StockAssignmentModal";

const SectionDetailsModal = ({ section, isOpen, onClose }: SectionDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<"inventory" | "consumption">("inventory");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<SectionInventory | null>(null);
  const { data: inventory = [], refetch } = useSectionInventory(section?.id || "");
  const { data: consumption = [], refetch: refetchConsumption } = useSectionConsumption(section?.id || "");

  if (!section) return null;

  const getManagerName = (section: Section) => {
    if (section.manager) {
      // Check if firstName and lastName are available
      if (section.manager.firstName && section.manager.lastName) {
        return `${section.manager.firstName} ${section.manager.lastName}`;
      }
      // Fall back to name if available
      if (section.manager.name) {
        return section.manager.name;
      }
      // Fall back to email
      return section.manager.email;
    }
    return `Manager ${section.managerId}`;
  };

  const tabs = [
    { id: "inventory" as const, label: "Current Inventory" },
    { id: "consumption" as const, label: "Consumption History" }
  ];

  const handleAssignSuccess = () => {
    refetch();
    setShowAssignModal(false);
  };

  const handleUseClick = (item: SectionInventory, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInventoryItem(item);
    setShowConsumptionModal(true);
  };

  const handleConsumptionSuccess = () => {
    refetch();
    refetchConsumption();
    setShowConsumptionModal(false);
    setSelectedInventoryItem(null);
  };

  const handleEditClick = (item: SectionInventory) => {
    setSelectedInventoryItem(item);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    refetch();
    setShowEditModal(false);
    setSelectedInventoryItem(null);
  };

  // Helper function to format quantity display for pack/box materials
  const formatQuantityDisplay = (quantity: number, material: RawMaterial | undefined, isBaseQuantity: boolean = false) => {
    if (!material) return `${quantity}`;

    const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
    if (isPackOrBox && !isBaseQuantity) {
      // For pack/box materials, show in the original unit (packs/boxes)
      return `${quantity} ${material.unit}`;
    }

    if (isPackOrBox && isBaseQuantity) {
      // If we need to show base quantity, show in base units
      const packInfo = material as unknown as { unitsPerPack?: number; baseUnit?: string };
      const baseUnit = packInfo.baseUnit || "pieces";
      return `${quantity} ${baseUnit}`;
    }

    return `${quantity} ${material.unit}`;
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`${section.name} - Details`} size="xl">
        <div className="space-y-6">
          {/* Section Info */}
          <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900/10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Type</p>
                <p className="text-lg text-gray-900 dark:text-gray-300 capitalize">{section.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Manager</p>
                <p className="text-lg text-gray-900 dark:text-gray-300">{getManagerName(section)}</p>
              </div>
            </div>
            {section.description && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600">Description</p>
                <p className="text-gray-900 dark:text-gray-300">{section.description}</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800">
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-300">Current Inventory</h3>
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAssignModal(true)}>
                  Assign Stock
                </Button>
              </div>

              {inventory.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 dark:text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">No inventory assigned to this section</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Click "Assign Stock" to add materials to this section</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inventory.map(item => {
                    const material = item.rawMaterial as RawMaterial;
                    const isPackOrBox = material?.unit === MeasurementUnit.PACKS || material?.unit === MeasurementUnit.BOXES;
                    const unitsPerContainer = isPackOrBox ? (material.unit === MeasurementUnit.PACKS ? material.unitsPerPack || 1 : material.unitsPerPack || 1) : 1;
                    const baseUnitName = material?.baseUnit || MeasurementUnit.PIECES;

                    // Calculate display values
                    let displayText = "";
                    if (isPackOrBox && material) {
                      // Prefer API-provided baseQuantity if available
                      const totalPieces = item.quantity ?? item.quantity * unitsPerContainer;
                      const fullContainers = Math.floor(totalPieces / unitsPerContainer);
                      displayText = `${fullContainers} ${material.unit} (${totalPieces} ${baseUnitName})`;
                    } else if (material) {
                      displayText = `${item.quantity} ${material.unit}`;
                    } else {
                      displayText = `${item.quantity}`;
                    }

                    return (
                      <div key={item.id} onClick={() => handleEditClick(item)} className="flex items-center justify-between p-4 border rounded-lg dark:bg-gray-900/10 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900/20 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-300">{item.rawMaterial?.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Category: {item.rawMaterial?.category}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-gray-300">{displayText}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Available</p>
                            {item.reservedQuantity > 0 && (
                              <p className="text-xs text-yellow-600">
                                {item.reservedQuantity} {isPackOrBox ? material?.unit : ""} reserved
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline" leftIcon={<Minus className="w-3 h-3" />} disabled={item.quantity <= 0} onClick={e => handleUseClick(item, e)} title="Record consumption">
                              Use
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* {inventory.map(item => (
                    <div key={item.id} onClick={() => handleEditClick(item)} className="flex items-center justify-between p-4 border rounded-lg dark:bg-gray-900/10 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900/20 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-300">{item.rawMaterial?.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Category: {item.rawMaterial?.category}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-gray-300">
                            {(() => {
                              const material = item.rawMaterial as RawMaterial;
                              if (!material) return `${item.quantity}`;
                              
                              const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
                              if (isPackOrBox) {
                                // For pack/box materials, determine units per pack/box and base unit
                                const unitsPerContainer = material.unit === MeasurementUnit.PACKS 
                                  ? (material.unitsPerPack || 1) 
                                  : (material.unitsPerBox || 1);
                                const baseUnitName = material.baseUnit || MeasurementUnit.PIECES;
                                
                                // Check if we have baseQuantity from the API (preferred)
                                if (item.baseQuantity && item.baseQuantity !== item.quantity) {
                                  // We have both pack quantity and base quantity from API
                                  return `${item.quantity} ${material.unit} (${item.baseQuantity} ${baseUnitName})`;
                                }
                                
                                // Fallback: determine if quantity is in packs or base units
                                if (item.quantity > 50 && item.quantity % unitsPerContainer === 0) {
                                  // Likely base quantity, convert to packs
                                  const packQuantity = item.quantity / unitsPerContainer;
                                  return `${packQuantity} ${material.unit} (${item.quantity} ${baseUnitName})`;
                                } else {
                                  // Likely pack quantity, show with base equivalent
                                  const baseQuantity = item.quantity * unitsPerContainer;
                                  return `${item.quantity} ${material.unit} (${baseQuantity} ${baseUnitName})`;
                                }
                              }
                              
                              return `${item.quantity} ${material.unit}`;
                            })()
                          }</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Available</p>
                          {item.reservedQuantity > 0 && <p className="text-xs text-yellow-600">{item.reservedQuantity} reserved</p>}
                        </div>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" leftIcon={<Minus className="w-3 h-3" />} disabled={item.quantity <= 0} onClick={e => handleUseClick(item, e)} title="Record consumption">
                            Use
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))} */}
                </div>
              )}
            </div>
          )}

          {activeTab === "consumption" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-300">Consumption History</h3>
              {consumption.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 dark:text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">No consumption data available</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Usage will appear here as items are consumed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {consumption.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg dark:bg-gray-900/10 dark:border-gray-800">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-300">{item.rawMaterial?.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(item.consumedDate).toLocaleDateString()} at {new Date(item.consumedDate).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-400">{item.reason}</p>
                      </div>
                      <div className="text-right">
                        {(() => {
                          const displayText = formatQuantityDisplay(item.quantity, item.rawMaterial as RawMaterial);
                          const { quantity, unit } = splitQuantityAndUnit(displayText);
                          return (
                            <>
                              <span className="text-2xl font-bold text-gray-900 dark:text-gray-300">{quantity}</span>
                              {unit && <span className="text-sm text-gray-500 dark:text-gray-400"> {unit}</span>}
                            </>
                          );
                        })()}
                        {item.orderId && <p className="text-xs text-blue-600 dark:text-blue-400">Order #: {item.orderId}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Edit Inventory Modal */}
      {selectedInventoryItem && (
        <SectionInventoryEditModal
          inventoryItem={selectedInventoryItem}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedInventoryItem(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default SectionDetailsModal;

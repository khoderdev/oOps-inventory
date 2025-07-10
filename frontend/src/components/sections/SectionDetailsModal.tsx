import { Minus, Package, Plus, Trash2, Utensils } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useRemoveRecipeFromSection, useSectionConsumption, useSectionInventory, useSectionRecipes } from "../../hooks/useSections";
import type { RawMaterial, Recipe, Section, SectionDetailsModalProps, SectionInventory } from "../../types";
import { MeasurementUnit } from "../../types";
import { splitQuantityAndUnit } from "../../utils/units";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConsumptionModal from "./ConsumptionModal";
import RecipeAssignmentModal from "./RecipeAssignmentModal";
import RecipesConsumptionModal from "./RecipesConsumptionModal";
import SectionInventoryEditModal from "./SectionInventoryEditModal";
import StockAssignmentModal from "./StockAssignmentModal";

const SectionDetailsModal = ({ section, isOpen, onClose }: SectionDetailsModalProps) => {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<"inventory" | "consumption" | "recipes">("inventory");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<SectionInventory | null>(null);
  const { data: inventory = [], refetch } = useSectionInventory(section?.id.toString() || "");
  const { data: consumption = [], refetch: refetchConsumption } = useSectionConsumption(section?.id.toString() || "");
  const { data: assignedRecipes = [], refetch: refetchAssignedRecipes, isError: isAssignedRecipesError, error: assignedRecipesError } = useSectionRecipes(section?.id.toString() || "");
  const [showRecipeAssignModal, setShowRecipeAssignModal] = useState(false);
  const [showRecipeDetailsModal, setShowRecipeDetailsModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const removeRecipeMutation = useRemoveRecipeFromSection();
  const [showRecipeConsumptionModal, setShowRecipeConsumptionModal] = useState(false);

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeDetailsModal(true);
  };

  const handleRemoveRecipe = async (assignmentId: number) => {
    try {
      const removedBy = state?.user?.id;
      if (!removedBy) throw new Error("Missing removedBy user ID");

      console.log("Removing recipe assignment with ID:", assignmentId);
      console.log("Removing recipe assignment with removedBy:", removedBy);

      await removeRecipeMutation.mutateAsync({
        assignmentId,
        removedBy,
        notes: "Optional reason here"
      });

      refetchAssignedRecipes();
    } catch (error) {
      console.error("Error removing recipe:", error);
    }
  };

  const handleRecipeAssignSuccess = () => {
    refetchAssignedRecipes();
    setShowRecipeAssignModal(false);
  };
  if (!section) return null;
  const getManagerName = (section: Section) => {
    return section.manager?.username;
  };

  const tabs = [
    { id: "inventory" as const, label: "Current Inventory" },
    { id: "consumption" as const, label: "Consumption History" },
    { id: "recipes" as const, label: "Assigned Recipes" }
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

  const formatQuantityDisplay = (quantity: number, material: RawMaterial | undefined) => {
    if (!material) return `${quantity}`;

    const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
    if (isPackOrBox) {
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
                <div className="flex space-x-2">
                  <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAssignModal(true)}>
                    Assign Stock
                  </Button>
                </div>
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
                    const packQty = item.packQuantity ?? 0;
                    const baseQty = item.quantity ?? 0;
                    const packUnit = material.unit || "PACKS";
                    const baseUnit = material.baseUnit || "UNITS";

                    const displayText = isPackOrBox ? `${packQty} ${packUnit} (${baseQty} ${baseUnit})` : `${baseQty} ${material.unit}`;

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
                                {item.reservedQuantity} {baseUnit} reserved
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
                              {unit && <span className="text-sm text-gray-500 dark:text-red-400"> {unit}</span>}
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

          {activeTab === "recipes" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-300">Assigned Recipes</h3>
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowRecipeAssignModal(true)}>
                  Assign Recipe
                </Button>
              </div>

              {isAssignedRecipesError ? (
                <div className="text-center py-8 text-red-500">
                  Error loading recipes: {assignedRecipesError.message}
                  <Button variant="outline" size="sm" onClick={() => refetchAssignedRecipes()} className="mt-2">
                    Retry
                  </Button>
                </div>
              ) : !assignedRecipes || assignedRecipes.length === 0 ? (
                <div className="text-center py-8">
                  <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4 dark:text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">No recipes assigned to this section</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Click "Assign Recipe" to add recipes to this section</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedRecipes.map(assignment => (
                    <div key={assignment.id} className="p-4 border rounded-lg dark:bg-gray-900/10 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors cursor-pointer relative group" onClick={() => assignment.recipe && handleRecipeClick(assignment.recipe)}>
                      <div className="flex justify-between items-start h-[75px]">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-300">{assignment.recipe?.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{assignment.recipe?.category}</p>
                        </div>

                        <div className="flex flex-col space-y-2 h-full justify-between items-end">
                          {assignment.recipe?.servingCost && <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{assignment.recipe.servingCost} serving cost</span>}
                          <Button
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedRecipe(assignment.recipe);
                              setShowRecipeConsumptionModal(true);
                            }}
                            leftIcon={<Plus className="w-4 h-4" />}
                            size="sm"
                            variant="outline"
                            className="w-fit px-2 py-1 text-center text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            Use
                          </Button>
                        </div>
                      </div>
                      <button
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => {
                          e.stopPropagation();
                          handleRemoveRecipe(Number(assignment.id));
                        }}
                        disabled={removeRecipeMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {selectedRecipe && (
            <Modal
              isOpen={showRecipeDetailsModal}
              onClose={() => {
                setShowRecipeDetailsModal(false);
                setSelectedRecipe(null);
              }}
              title={selectedRecipe.name}
              size="lg"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Category</p>
                    <p className="text-gray-900 dark:text-gray-300 capitalize">{selectedRecipe.category}</p>
                  </div>
                  {selectedRecipe.servingCost && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Serving Cost</p>
                      <p className="text-gray-900 dark:text-gray-300">${selectedRecipe.servingCost}</p>
                    </div>
                  )}
                </div>

                {selectedRecipe.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="text-gray-900 dark:text-gray-300">{selectedRecipe.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Ingredients</h4>
                  <div className="space-y-2">
                    {Array.isArray(selectedRecipe.ingredients) &&
                      selectedRecipe.ingredients.map((ingredient, index) => (
                        <div key={index} className="flex justify-between py-2 border-b dark:border-gray-800">
                          <span className="text-gray-900 dark:text-gray-300">{ingredient.raw_material?.name}</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {ingredient.quantity} {ingredient.raw_material?.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {selectedRecipe.costAnalysis && (
                  <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900/10">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Cost Analysis</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Cost</p>
                        <p className="font-medium text-gray-900 dark:text-gray-300">${selectedRecipe.costAnalysis.totalCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Per Serving</p>
                        <p className="font-medium text-gray-900 dark:text-gray-300">${selectedRecipe.costAnalysis.perServingCost.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Modal>
          )}
        </div>
      </Modal>

      {/* Stock Assignment Modal */}
      <StockAssignmentModal section={section} isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} onSuccess={handleAssignSuccess} />

      {/* Recipe Assignment Modal */}
      <RecipeAssignmentModal section={section} isOpen={showRecipeAssignModal} onClose={() => setShowRecipeAssignModal(false)} onSuccess={handleRecipeAssignSuccess} assignedRecipes={assignedRecipes} />

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

      {selectedRecipe && (
        <RecipesConsumptionModal
          section={section}
          recipe={selectedRecipe}
          isOpen={showRecipeConsumptionModal}
          onClose={() => {
            setShowRecipeConsumptionModal(false);
            setSelectedRecipe(null);
          }}
          onSuccess={() => {
            refetch();
            refetchConsumption();
          }}
        />
      )}
    </>
  );
};

export default SectionDetailsModal;

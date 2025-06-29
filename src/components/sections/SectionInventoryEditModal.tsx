import { useEffect, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useRemoveSectionInventory, useSectionInventory, useUpdateSectionInventory } from "../../hooks/useSections";
import type { SectionInventory } from "../../types";
import { MeasurementUnit } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import { Trash2 } from "lucide-react";

interface SectionInventoryEditModalProps {
  inventoryItem: SectionInventory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SectionInventoryEditModal = ({ inventoryItem, isOpen, onClose, onSuccess }: SectionInventoryEditModalProps) => {
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { state } = useApp();
  const updateMutation = useUpdateSectionInventory();
  const removeMutation = useRemoveSectionInventory();
  const { refetch } = useSectionInventory(inventoryItem?.sectionId || "");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && inventoryItem) {
      // Convert base quantity to pack quantity for display
      const material = inventoryItem.rawMaterial;
      if (material) {
        const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
        if (isPackOrBox) {
          const packInfo = material as unknown as { unitsPerPack?: number };
          const unitsPerPack = packInfo.unitsPerPack || 1;
          const packQuantity = inventoryItem.quantity / unitsPerPack;
          setQuantity(packQuantity);
        } else {
          setQuantity(inventoryItem.quantity);
        }
      } else {
        setQuantity(inventoryItem.quantity);
      }
      setNotes("");
      setErrors({});
    }
  }, [isOpen, inventoryItem]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inventoryItem || !validateForm()) {
      return;
    }

    // Convert pack quantity back to base quantity if needed
    let finalQuantity = quantity;
    const material = inventoryItem.rawMaterial;
    if (material) {
      const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
      if (isPackOrBox) {
        const packInfo = material as unknown as { unitsPerPack?: number };
        const unitsPerPack = packInfo.unitsPerPack || 1;
        finalQuantity = quantity * unitsPerPack;
      }
    }

    try {
      await updateMutation.mutateAsync({
        inventoryId: inventoryItem.id,
        quantity: finalQuantity,
        updatedBy: state.user?.name || "Unknown",
        notes: notes || `Updated inventory for ${inventoryItem.rawMaterial?.name}`
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating inventory:", error);
    }
  };

  const handleDeleteClick = async () => {
    if (!inventoryItem) return;

    try {
      await removeMutation.mutateAsync({
        inventoryId: inventoryItem.id,
        removedBy: state.user?.name || "Unknown",
        notes: `Removed ${inventoryItem.rawMaterial?.name} from ${inventoryItem?.section?.name}`
      });

      refetch(); // Refresh the inventory data
      onSuccess(); // Notify parent component and close modal
      onClose(); // Close the modal
    } catch (error) {
      console.error("Error removing inventory:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (field === "quantity") {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      setQuantity(Math.floor(numValue) || 0);
    } else if (field === "notes") {
      setNotes(value as string);
    }

    // Clear error when user makes changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!inventoryItem) return null;

  const material = inventoryItem.rawMaterial;
  const isPackOrBox = material?.unit === MeasurementUnit.PACKS || material?.unit === MeasurementUnit.BOXES;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${material?.name} Inventory`} size="md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg dark:bg-blue-900/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-300">Current Quantity:</p>
                  <p className="text-blue-700 dark:text-blue-100 font-bold">
                    {(() => {
                      if (!material) return `${inventoryItem.quantity}`;

                      if (isPackOrBox) {
                        const packInfo = material as unknown as { unitsPerPack?: number; baseUnit?: string };
                        const unitsPerPack = packInfo.unitsPerPack || 1;
                        const baseUnit = packInfo.baseUnit || "pieces";
                        const packQuantity = inventoryItem.quantity / unitsPerPack;
                        return `${packQuantity} ${material.unit} (${inventoryItem.quantity} ${baseUnit})`;
                      }

                      return `${inventoryItem.quantity} ${material.unit}`;
                    })()}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-300">Unit Cost:</p>
                  <p className="text-blue-700 dark:text-blue-100 font-bold">${material?.unitCost.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Quantity {isPackOrBox ? `(${material?.unit})` : `(${material?.unit})`}</label>
              <Input type="number" min="0" step="1" value={quantity} onChange={e => handleInputChange("quantity", parseFloat(e.target.value) || 0)} error={errors.quantity} required helperText={isPackOrBox ? `Enter quantity in ${material?.unit}` : `Enter quantity in ${material?.unit}`} />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
              <Input type="text" value={notes} onChange={e => handleInputChange("notes", e.target.value)} placeholder="Reason for update..." />
            </div>

            {quantity > 0 && material && (
              <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Value:</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-300">${(quantity * material.unitCost).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center space-x-3 mt-10">
            <Button size="sm" variant="danger" leftIcon={<Trash2 className="w-3 h-3" />} onClick={handleDeleteClick} title="Remove from section" loading={removeMutation.isPending}>
              Remove
            </Button>
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending || removeMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending} disabled={quantity <= 0 || removeMutation.isPending}>
                Update Inventory
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default SectionInventoryEditModal;

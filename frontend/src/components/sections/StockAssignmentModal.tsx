import { useEffect, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useAssignStockToSection } from "../../hooks/useSections";
import { useStockLevels } from "../../hooks/useStock";
import type { RawMaterial, Section } from "../../types";
import { MeasurementUnit } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

interface StockAssignmentModalProps {
  section: Section | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const StockAssignmentModal = ({ section, isOpen, onClose, onSuccess }: StockAssignmentModalProps) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: stockLevels = [] } = useStockLevels();
  const { state } = useApp();
  const assignMutation = useAssignStockToSection();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedMaterialId("");
      setQuantity(0);
      setErrors({});
    }
  }, [isOpen]);

  // Filter stock levels to only show items with available quantity
  const availableStock = stockLevels.filter(level => level.availableUnitsQuantity > 0);

  // Helper function to format quantity display for pack/box materials
  const formatQuantityDisplay = (quantity: number, material: RawMaterial) => {
    if (!material) return `${quantity}`;

    const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
    if (isPackOrBox) {
      const packInfo = material as unknown as { unitsPerPack?: number; baseUnit?: string };
      const unitsPerPack = packInfo.unitsPerPack || 1;
      const baseUnit = packInfo.baseUnit || "pieces";
      const packQuantity = quantity / unitsPerPack;
      return `${packQuantity} ${material.unit} (${quantity} ${baseUnit})`;
    }

    return `${quantity} ${material.unit}`;
  };

  const materialOptions = availableStock.map(level => {
    const material = level.rawMaterial;
    if (!material) return { value: "", label: `Unknown Material (${level.availableUnitsQuantity} available)` };

    const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
    if (isPackOrBox) {
      const packQuantity = level.availableUnitsQuantity;
      return {
        value: material.id,
        label: `${material.name} (${packQuantity} ${material.unit} available)`
      };
    }

    return {
      value: material.id,
      label: `${material.name} (${level.availableUnitsQuantity} ${material.unit} available)`
    };
  });

  const selectedStockLevel = availableStock.find(level => level.rawMaterial?.id === selectedMaterialId);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedMaterialId) {
      newErrors.selectedMaterialId = "Please select a material";
    }

    if (quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (selectedStockLevel) {
      const material = selectedStockLevel.rawMaterial;
      if (material) {
        const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
        if (isPackOrBox) {
          // For pack/box materials, quantity input is in packs, but we need to validate against base quantity
          const packInfo = material as unknown as { unitsPerPack?: number };
          const unitsPerPack = packInfo.unitsPerPack || 1;
          const baseQuantityNeeded = quantity * unitsPerPack;

          if (baseQuantityNeeded > selectedStockLevel.availableSubUnitsQuantity) {
            const maxPacks = selectedStockLevel.availableUnitsQuantity;
            newErrors.quantity = `Quantity cannot exceed available stock (${maxPacks} ${material.unit})`;
          }
        } else {
          // For regular materials, validate directly
          if (quantity > selectedStockLevel.availableUnitsQuantity) {
            newErrors.quantity = `Quantity cannot exceed available stock (${selectedStockLevel.availableUnitsQuantity} ${material.unit})`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!section || !validateForm()) {
      return;
    }

    try {
      // Send the quantity as entered by user (pack quantity for pack/box materials)
      // The backend will handle the conversion to base units
      const quantityToSend = quantity;

      const assignmentData = {
        sectionId: section.id,
        rawMaterialId: selectedMaterialId,
        quantity: quantityToSend,
        assignedBy: state.user?.name || "Unknown",
        notes: `Assigned to ${section.name}`
      };

      await assignMutation.mutateAsync(assignmentData);

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error assigning stock:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (field === "selectedMaterialId") {
      setSelectedMaterialId(value as string);
      setQuantity(0);
    } else if (field === "quantity") {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      setQuantity(Math.floor(numValue) || 0);
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!section) return null;

  const isLoading = assignMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Stock to ${section.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Select label="Select Material" options={[{ value: "", label: "Choose a material..." }, ...materialOptions]} value={selectedMaterialId} onChange={e => handleInputChange("selectedMaterialId", e.target.value)} error={errors.selectedMaterialId} required />

          {selectedStockLevel && (
            <div className="bg-blue-50 p-4 rounded-lg dark:bg-blue-900/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-300">Available Stock:</p>
                  <p className="text-blue-700 dark:text-blue-100 font-bold">{formatQuantityDisplay(selectedStockLevel.availableUnitsQuantity, selectedStockLevel.rawMaterial as RawMaterial)}</p>
                </div>
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-300">Unit Cost:</p>
                  <p className="text-blue-700 dark:text-blue-100 font-bold">${selectedStockLevel.rawMaterial?.unitCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity to Assign</label>
              {selectedStockLevel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const material = selectedStockLevel.rawMaterial;
                    if (material) {
                      const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
                      if (isPackOrBox) {
                        const maxPacks = selectedStockLevel.availableUnitsQuantity;
                        handleInputChange("quantity", maxPacks);
                      } else {
                        handleInputChange("quantity", selectedStockLevel.availableUnitsQuantity);
                      }
                    }
                  }}
                  disabled={!selectedMaterialId}
                >
                  Assign All
                </Button>
              )}
            </div>
            <Input
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={e => handleInputChange("quantity", parseFloat(e.target.value) || 0)}
              error={errors.quantity}
              required
              helperText={
                selectedStockLevel
                  ? (() => {
                      const material = selectedStockLevel.rawMaterial;
                      if (material) {
                        const isPackOrBox = material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES;
                        if (isPackOrBox) {
                          const maxPacks = selectedStockLevel.availableUnitsQuantity;
                          return `Max: ${maxPacks} ${material.unit}`;
                        } else {
                          return `Max: ${selectedStockLevel.availableUnitsQuantity} ${material.unit}`;
                        }
                      }
                      return undefined;
                    })()
                  : undefined
              }
              disabled={!selectedMaterialId}
            />
          </div>

          {quantity > 0 && selectedStockLevel && (
            <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900/10">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Value:</span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-300">${(quantity * (selectedStockLevel.rawMaterial?.unitCost || 0)).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} disabled={!selectedMaterialId || quantity <= 0}>
            Assign Stock
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StockAssignmentModal;

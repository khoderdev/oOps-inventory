import { useEffect, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useAssignStockToSection } from "../../hooks/useSections";
import { useStockLevels } from "../../hooks/useStock";
import type { Section } from "../../types";
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
  const availableStock = stockLevels.filter(level => level.availableQuantity > 0);

  const materialOptions = availableStock.map(level => ({
    value: level.rawMaterialId,
    label: `${level.rawMaterial?.name} (${level.availableQuantity} ${level.rawMaterial?.unit} available)`
  }));

  const selectedStockLevel = availableStock.find(level => level.rawMaterialId === selectedMaterialId);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedMaterialId) {
      newErrors.selectedMaterialId = "Please select a material";
    }

    if (quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (selectedStockLevel && quantity > selectedStockLevel.availableQuantity) {
      newErrors.quantity = `Quantity cannot exceed available stock (${selectedStockLevel.availableQuantity})`;
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
      await assignMutation.mutateAsync({
        sectionId: section.id,
        rawMaterialId: selectedMaterialId,
        quantity,
        assignedBy: state.user?.name || "Unknown",
        notes: `Assigned to ${section.name}`
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error assigning stock:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (field === "selectedMaterialId") {
      setSelectedMaterialId(value as string);
      setQuantity(0); // Reset quantity when material changes
    } else if (field === "quantity") {
      setQuantity(value as number);
    }

    // Clear error when user makes changes
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
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-900">Available Stock:</p>
                  <p className="text-blue-700">
                    {selectedStockLevel.availableQuantity} {selectedStockLevel.rawMaterial?.unit}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Unit Cost:</p>
                  <p className="text-blue-700">${selectedStockLevel.rawMaterial?.unitCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <Input label="Quantity to Assign" type="number" min="0" max={selectedStockLevel?.availableQuantity || undefined} step="0.01" value={quantity} onChange={e => handleInputChange("quantity", parseFloat(e.target.value) || 0)} error={errors.quantity} required helperText={selectedStockLevel ? `Max: ${selectedStockLevel.availableQuantity} ${selectedStockLevel.rawMaterial?.unit}` : undefined} disabled={!selectedMaterialId} />

          {quantity > 0 && selectedStockLevel && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Value:</span>
                <span className="text-lg font-bold text-gray-900">${(quantity * (selectedStockLevel.rawMaterial?.unitCost || 0)).toFixed(2)}</span>
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

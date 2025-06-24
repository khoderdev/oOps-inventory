import { useEffect, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useRecordConsumption } from "../../hooks/useSections";
import type { Section, SectionInventory } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

interface ConsumptionModalProps {
  section: Section;
  inventoryItem: SectionInventory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ConsumptionModal = ({ section, inventoryItem, isOpen, onClose, onSuccess }: ConsumptionModalProps) => {
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const [orderId, setOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { state } = useApp();
  const recordMutation = useRecordConsumption();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && inventoryItem) {
      setQuantity(0);
      setReason("production");
      setOrderId("");
      setNotes("");
      setErrors({});
    }
  }, [isOpen, inventoryItem]);

  const reasonOptions = [
    { value: "production", label: "Production/Cooking" },
    { value: "waste", label: "Waste/Spoilage" },
    { value: "sampling", label: "Sampling/Testing" },
    { value: "transfer", label: "Transfer to Another Section" },
    { value: "adjustment", label: "Inventory Adjustment" },
    { value: "other", label: "Other" }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (inventoryItem && quantity > inventoryItem.quantity) {
      newErrors.quantity = `Quantity cannot exceed available stock (${inventoryItem.quantity})`;
    }

    if (!reason) {
      newErrors.reason = "Please select a reason";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inventoryItem || !validateForm()) {
      return;
    }

    try {
      await recordMutation.mutateAsync({
        sectionId: section.id,
        rawMaterialId: inventoryItem.rawMaterialId,
        quantity,
        consumedBy: state.user?.name || "Unknown",
        reason,
        orderId: orderId || undefined,
        notes: notes || undefined
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error recording consumption:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    switch (field) {
      case "quantity":
        setQuantity(value as number);
        break;
      case "reason":
        setReason(value as string);
        break;
      case "orderId":
        setOrderId(value as string);
        break;
      case "notes":
        setNotes(value as string);
        break;
    }

    // Clear error when user makes changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!inventoryItem) return null;

  const isLoading = recordMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Usage - ${inventoryItem.rawMaterial?.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Item Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900">Available Quantity:</p>
                <p className="text-gray-700">
                  {inventoryItem.quantity} {inventoryItem.rawMaterial?.unit}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Section:</p>
                <p className="text-gray-700">{section.name}</p>
              </div>
            </div>
          </div>

          <Input label="Quantity Used" type="number" min="0" max={inventoryItem.quantity} step="0.01" value={quantity} onChange={e => handleInputChange("quantity", parseFloat(e.target.value) || 0)} error={errors.quantity} required helperText={`Max: ${inventoryItem.quantity} ${inventoryItem.rawMaterial?.unit}`} />

          <Select label="Reason for Usage" options={[{ value: "", label: "Select a reason..." }, ...reasonOptions]} value={reason} onChange={e => handleInputChange("reason", e.target.value)} error={errors.reason} required />

          <Input label="Order ID (Optional)" value={orderId} onChange={e => handleInputChange("orderId", e.target.value)} placeholder="e.g., ORD-001" helperText="Link this usage to a specific order" />

          <Input label="Notes (Optional)" value={notes} onChange={e => handleInputChange("notes", e.target.value)} placeholder="Additional notes about this usage" />

          {quantity > 0 && inventoryItem.rawMaterial && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Estimated Value:</span>
                <span className="text-lg font-bold text-blue-900">${(quantity * inventoryItem.rawMaterial.unitCost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-blue-600">Remaining after usage:</span>
                <span className="text-sm font-medium text-blue-800">
                  {(inventoryItem.quantity - quantity).toFixed(2)} {inventoryItem.rawMaterial.unit}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} disabled={quantity <= 0 || !reason}>
            Record Usage
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ConsumptionModal;

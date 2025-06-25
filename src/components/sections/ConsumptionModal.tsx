import { useEffect, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useRecordConsumption } from "../../hooks/useSections";
import type { Section, SectionInventory } from "../../types";
import { MeasurementUnit } from "../../types";
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
  const [usageUnit, setUsageUnit] = useState<"pack" | "individual">("pack");
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
      setUsageUnit(isPackOrBox() ? "pack" : "individual");
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

  const isPackOrBox = () => {
    return inventoryItem?.rawMaterial?.unit === MeasurementUnit.PACKS || inventoryItem?.rawMaterial?.unit === MeasurementUnit.BOXES;
  };

  const getPackInfo = () => {
    if (!inventoryItem?.rawMaterial || !isPackOrBox()) return null;

    const material = inventoryItem.rawMaterial as unknown as {
      unitsPerPack?: number;
      baseUnit?: MeasurementUnit;
    };

    return {
      unitsPerPack: material.unitsPerPack || 1,
      baseUnit: material.baseUnit || MeasurementUnit.PIECES,
      packUnit: inventoryItem.rawMaterial.unit
    };
  };

  const convertToBaseQuantity = (inputQuantity: number) => {
    if (!isPackOrBox() || usageUnit === "individual") {
      return inputQuantity;
    }

    const packInfo = getPackInfo();
    return inputQuantity * (packInfo?.unitsPerPack || 1);
  };

  const convertFromBaseQuantity = (baseQuantity: number) => {
    if (!isPackOrBox() || usageUnit === "individual") {
      return baseQuantity;
    }

    const packInfo = getPackInfo();
    return baseQuantity / (packInfo?.unitsPerPack || 1);
  };

  const getMaxQuantity = () => {
    if (!inventoryItem) return 0;

    if (isPackOrBox() && usageUnit === "pack") {
      return Math.floor(convertFromBaseQuantity(inventoryItem.quantity));
    }

    return inventoryItem.quantity;
  };

  const getDisplayUnit = () => {
    if (!inventoryItem?.rawMaterial) return "";

    if (isPackOrBox()) {
      const packInfo = getPackInfo();
      if (usageUnit === "pack") {
        return inventoryItem.rawMaterial.unit.toLowerCase();
      } else {
        return packInfo?.baseUnit?.toLowerCase() || "pieces";
      }
    }

    return inventoryItem.rawMaterial.unit.toLowerCase();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    const maxQty = getMaxQuantity();
    if (quantity > maxQty) {
      newErrors.quantity = `Quantity cannot exceed available stock (${maxQty} ${getDisplayUnit()})`;
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
      // Always submit in base units (individual pieces for packs/boxes)
      const baseQuantity = convertToBaseQuantity(quantity);

      await recordMutation.mutateAsync({
        sectionId: section.id,
        rawMaterialId: inventoryItem.rawMaterialId,
        quantity: baseQuantity,
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
      case "usageUnit":
        setUsageUnit(value as "pack" | "individual");
        setQuantity(0); // Reset quantity when unit changes
        break;
    }

    // Clear error when user makes changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!inventoryItem) return null;

  const isLoading = recordMutation.isPending;
  const packInfo = getPackInfo();
  const maxQuantity = getMaxQuantity();
  const baseQuantityUsed = convertToBaseQuantity(quantity);
  const remainingAfterUsage = inventoryItem.quantity - baseQuantityUsed;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Usage - ${inventoryItem.rawMaterial?.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Item Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900">Available Stock:</p>
                {isPackOrBox() && packInfo ? (
                  <div className="space-y-1">
                    <p className="text-gray-700">
                      {convertFromBaseQuantity(inventoryItem.quantity).toFixed(0)} {inventoryItem.rawMaterial?.unit}
                    </p>
                    <p className="text-xs text-gray-500">
                      ({inventoryItem.quantity} {packInfo.baseUnit} total)
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-700">
                    {inventoryItem.quantity} {inventoryItem.rawMaterial?.unit}
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Section:</p>
                <p className="text-gray-700">{section.name}</p>
              </div>
            </div>

            {/* Pack/Box Info */}
            {isPackOrBox() && packInfo && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  Each {inventoryItem.rawMaterial?.unit.slice(0, -1)} contains {packInfo.unitsPerPack} {packInfo.baseUnit}
                </p>
              </div>
            )}
          </div>

          {/* Usage Unit Selection for Packs/Boxes */}
          {isPackOrBox() && packInfo && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Usage Unit</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input type="radio" name="usageUnit" value="pack" checked={usageUnit === "pack"} onChange={e => handleInputChange("usageUnit", e.target.value)} className="mr-2" />
                  <span className="text-sm">By {inventoryItem.rawMaterial?.unit.slice(0, -1)}</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="usageUnit" value="individual" checked={usageUnit === "individual"} onChange={e => handleInputChange("usageUnit", e.target.value)} className="mr-2" />
                  <span className="text-sm">By {packInfo.baseUnit}</span>
                </label>
              </div>
            </div>
          )}

          <Input label={`Quantity Used (${getDisplayUnit()})`} type="number" min="0" max={maxQuantity} step={usageUnit === "pack" ? "1" : "0.01"} value={quantity} onChange={e => handleInputChange("quantity", parseFloat(e.target.value) || 0)} error={errors.quantity} required helperText={`Max: ${maxQuantity} ${getDisplayUnit()}`} />

          {/* Conversion Display */}
          {isPackOrBox() && packInfo && quantity > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Conversion:</strong> {quantity} {getDisplayUnit()} = {baseQuantityUsed} {packInfo.baseUnit}
              </p>
            </div>
          )}

          <Select label="Reason for Usage" options={[{ value: "", label: "Select a reason..." }, ...reasonOptions]} value={reason} onChange={e => handleInputChange("reason", e.target.value)} error={errors.reason} required />

          <Input label="Order ID (Optional)" value={orderId} onChange={e => handleInputChange("orderId", e.target.value)} placeholder="e.g., ORD-001" helperText="Link this usage to a specific order" />

          <Input label="Notes (Optional)" value={notes} onChange={e => handleInputChange("notes", e.target.value)} placeholder="Additional notes about this usage" />

          {/* Usage Summary */}
          {quantity > 0 && inventoryItem.rawMaterial && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Estimated Value:</span>
                <span className="text-lg font-bold text-blue-900">${(baseQuantityUsed * inventoryItem.rawMaterial.unitCost).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-600">Remaining after usage:</span>
                <div className="text-right">
                  {isPackOrBox() && packInfo ? (
                    <div>
                      <span className="text-sm font-medium text-blue-800">
                        {Math.floor(convertFromBaseQuantity(remainingAfterUsage))} {inventoryItem.rawMaterial.unit}
                      </span>
                      <div className="text-xs text-blue-600">
                        ({remainingAfterUsage.toFixed(2)} {packInfo.baseUnit} total)
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-blue-800">
                      {remainingAfterUsage.toFixed(2)} {inventoryItem.rawMaterial.unit}
                    </span>
                  )}
                </div>
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

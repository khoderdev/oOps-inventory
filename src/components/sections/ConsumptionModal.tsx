import { useEffect, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useRecordConsumption } from "../../hooks/useSections";
import type { ConsumptionModalProps } from "../../types";
import { MeasurementUnit } from "../../types";
import { getStepValue } from "../../utils/units";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

const ConsumptionModal = ({ section, inventoryItem, isOpen, onClose, onSuccess }: ConsumptionModalProps) => {
  const [quantity, setQuantity] = useState("");
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
      setQuantity("");
      setReason("selling");
      setOrderId("");
      setNotes("");
      setUsageUnit(inventoryItem?.rawMaterial?.unit === MeasurementUnit.PACKS || inventoryItem?.rawMaterial?.unit === MeasurementUnit.BOXES ? "pack" : "individual");
      setErrors({});
    }
  }, [isOpen, inventoryItem]);

  const reasonOptions = [
    { value: "selling", label: "Selling" },
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
    if (!isPackOrBox()) {
      return inputQuantity;
    }

    const packInfo = getPackInfo();
    if (usageUnit === "pack") {
      return inputQuantity * (packInfo?.unitsPerPack || 1);
    } else {
      // For individual units, the input is already in base units
      return inputQuantity;
    }
  };

  const getMaxQuantity = () => {
    if (!inventoryItem) return 0;

    if (isPackOrBox()) {
      if (usageUnit === "pack") {
        return Math.floor(inventoryItem.quantity / (getPackInfo()?.unitsPerPack || 1));
      } else {
        // For individual units, return total available in base units
        return inventoryItem.quantity;
      }
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

  const getStepValueForDisplay = () => {
    if (!inventoryItem?.rawMaterial) return "1";

    if (isPackOrBox()) {
      const packInfo = getPackInfo();
      if (usageUnit === "pack") {
        return getStepValue(inventoryItem.rawMaterial.unit as MeasurementUnit);
      } else {
        // For individual units, use the base unit's step value
        return getStepValue(packInfo?.baseUnit as MeasurementUnit);
      }
    }

    return getStepValue(inventoryItem.rawMaterial.unit as MeasurementUnit);
  };

  // Helper function to get numeric quantity
  const getNumericQuantity = () => {
    return parseFloat(quantity) || 0;
  };

  const getFormattedQuantity = (qty: number, unit: string) => {
    return `${qty} ${unit}`;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const numericQuantity = getNumericQuantity();

    if (numericQuantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    const maxQty = getMaxQuantity();
    if (numericQuantity > maxQty) {
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
      const baseQuantity = convertToBaseQuantity(getNumericQuantity());

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
        setQuantity(value as string);
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
        setQuantity(""); // Reset quantity when unit changes
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
  const baseQuantityUsed = convertToBaseQuantity(getNumericQuantity());
  const remainingAfterUsage = inventoryItem.quantity - baseQuantityUsed;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Usage - ${inventoryItem.rawMaterial?.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Item Info */}
          <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900/10">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-300">Available Stock:</p>
                {isPackOrBox() && packInfo ? (
                  <div className="space-y-1">
                    {usageUnit === "pack" ? (
                      <>
                        <p className="text-gray-700 dark:text-gray-300">
                          {Math.floor(inventoryItem.quantity / packInfo.unitsPerPack)} {inventoryItem.rawMaterial?.unit}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ({inventoryItem.quantity} {packInfo.baseUnit} total)
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-700 dark:text-gray-300">
                          {inventoryItem.quantity} {packInfo.baseUnit}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ({Math.floor(inventoryItem.quantity / packInfo.unitsPerPack)} {inventoryItem.rawMaterial?.unit} total)
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">
                    {inventoryItem.quantity} {inventoryItem.rawMaterial?.unit}
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-300">Section:</p>
                <p className="text-gray-700 dark:text-gray-300">{section.name}</p>
              </div>
            </div>

            {/* Pack/Box Info */}
            {isPackOrBox() && packInfo && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Each {inventoryItem.rawMaterial?.unit.slice(0, -1)} contains {packInfo.unitsPerPack} {packInfo.baseUnit}
                </p>
              </div>
            )}
          </div>

          {/* Usage Unit Selection for Packs/Boxes */}
          {isPackOrBox() && packInfo && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Usage Unit</label>
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

          <Input autoFocus label={`Quantity Used (${getDisplayUnit()})`} type="number" min="0" max={maxQuantity} step={getStepValueForDisplay()} value={quantity} onChange={e => handleInputChange("quantity", e.target.value)} error={errors.quantity} required helperText={`Max: ${getFormattedQuantity(maxQuantity, getDisplayUnit())}`} />

          <Select label="Reason for Usage" options={[{ value: "", label: "Select a reason..." }, ...reasonOptions]} value={reason} onChange={e => handleInputChange("reason", e.target.value)} error={errors.reason} required />

          <Input label="Order ID (Optional)" value={orderId} onChange={e => handleInputChange("orderId", e.target.value)} placeholder="e.g., ORD-001" helperText="Link this usage to a specific order" />

          <Input label="Notes (Optional)" value={notes} onChange={e => handleInputChange("notes", e.target.value)} placeholder="Additional notes about this usage" />

          {/* Usage Summary */}
          {getNumericQuantity() > 0 && inventoryItem.rawMaterial && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 dark:bg-blue-900/10">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Estimated Value:</span>
                <span className="text-lg font-bold text-blue-900 dark:text-blue-300">
                  $
                  {(() => {
                    const numericQuantity = getNumericQuantity();
                    // Calculate value based on the unit being used
                    if (isPackOrBox() && usageUnit === "pack") {
                      // For packs, use the pack unit cost
                      return (numericQuantity * inventoryItem.rawMaterial.unitCost).toFixed(2);
                    } else {
                      // For individual units, calculate individual cost
                      const packInfo = getPackInfo();
                      if (packInfo && isPackOrBox()) {
                        const individualCost = inventoryItem.rawMaterial.unitCost / packInfo.unitsPerPack;
                        return (numericQuantity * individualCost).toFixed(2);
                      } else {
                        return (numericQuantity * inventoryItem.rawMaterial.unitCost).toFixed(2);
                      }
                    }
                  })()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-600 dark:text-blue-400">Remaining after usage:</span>
                <div className="text-right">
                  {isPackOrBox() && packInfo ? (
                    <div>
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{usageUnit === "pack" ? `${Math.floor(remainingAfterUsage / packInfo.unitsPerPack)} ${inventoryItem.rawMaterial.unit}` : `${remainingAfterUsage} ${packInfo.baseUnit}`}</span>
                      <div className="text-xs text-blue-600 dark:text-blue-400">{usageUnit === "pack" ? `(${remainingAfterUsage} ${packInfo.baseUnit} total)` : `(${(remainingAfterUsage / packInfo.unitsPerPack).toFixed(2)} ${inventoryItem.rawMaterial.unit} total)`}</div>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
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
          <Button type="submit" loading={isLoading} disabled={getNumericQuantity() <= 0 || !reason}>
            Record Usage
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ConsumptionModal;

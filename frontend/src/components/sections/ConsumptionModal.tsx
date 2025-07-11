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
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedOrderId, setGeneratedOrderId] = useState("");

  const { state } = useApp();
  const recordMutation = useRecordConsumption();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && inventoryItem) {
      setQuantity("");
      setReason("selling");
      setNotes("");
      setErrors({});
      setGeneratedOrderId("");
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

  const isPackOrBox = () => inventoryItem?.rawMaterial?.unit === MeasurementUnit.PACKS || inventoryItem?.rawMaterial?.unit === MeasurementUnit.BOXES;

  const getPackInfo = () => {
    if (!inventoryItem?.rawMaterial || !isPackOrBox()) return null;
    const material = inventoryItem.rawMaterial as {
      unitsPerPack?: number;
      baseUnit?: MeasurementUnit;
    };
    return {
      unitsPerPack: material.unitsPerPack || 1,
      baseUnit: material.baseUnit || MeasurementUnit.PIECES,
      packUnit: inventoryItem.rawMaterial.unit
    };
  };

  const convertToBaseQuantity = (inputQuantity: number) => inputQuantity;
  const getMaxQuantity = () => (inventoryItem ? inventoryItem.quantity : 0);
  const getDisplayUnit = () => (isPackOrBox() ? getPackInfo()?.baseUnit?.toLowerCase() || "pieces" : inventoryItem.rawMaterial.unit.toLowerCase());
  const getStepValueForDisplay = () => getStepValue(isPackOrBox() ? (getPackInfo()?.baseUnit as MeasurementUnit) : (inventoryItem.rawMaterial.unit as MeasurementUnit));
  const getNumericQuantity = () => parseFloat(quantity) || 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const numericQuantity = getNumericQuantity();

    if (numericQuantity <= 0) newErrors.quantity = "Quantity must be greater than 0";
    if (numericQuantity > getMaxQuantity()) newErrors.quantity = `Quantity cannot exceed available stock (${getMaxQuantity()} ${getDisplayUnit()})`;
    if (!reason) newErrors.reason = "Please select a reason";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryItem || !validateForm()) return;

    try {
      const baseQuantity = convertToBaseQuantity(getNumericQuantity());
      const result = await recordMutation.mutateAsync({
        sectionId: section.id,
        rawMaterialId: inventoryItem.rawMaterialId,
        quantity: baseQuantity,
        consumedBy: state.user?.id || "1",
        reason,
        notes: notes || undefined
      });

      if (result?.data?.order_id) {
        setGeneratedOrderId(result.data.order_id);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error recording consumption:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    switch (field) {
      case "quantity":
        setQuantity(String(value));
        break;
      case "reason":
        setReason(value as string);
        break;
      case "notes":
        setNotes(value as string);
        break;
    }
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
          {generatedOrderId && (
            <div className="bg-blue-50 p-4 rounded-lg dark:bg-blue-900/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Order ID:</span>
                <span className="text-lg font-bold text-blue-900 dark:text-blue-300">{generatedOrderId}</span>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900/10">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-300">Available Stock:</p>
                {isPackOrBox() && packInfo ? (
                  <div className="space-y-1">
                    <p className="text-gray-700 dark:text-gray-300">
                      {inventoryItem.quantity} {packInfo.baseUnit}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ({Math.floor(inventoryItem.quantity / packInfo.unitsPerPack)} {inventoryItem.rawMaterial?.unit} total)
                    </p>
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

            {isPackOrBox() && packInfo && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Each {inventoryItem.rawMaterial?.unit.slice(0, -1)} contains {packInfo.unitsPerPack} {packInfo.baseUnit}
                </p>
              </div>
            )}
          </div>

          <Input autoFocus label={`Quantity Used (${getDisplayUnit()})`} type="number" min="0" max={maxQuantity} step={getStepValueForDisplay()} value={quantity} onValueChange={value => handleInputChange("quantity", value)} error={errors.quantity} required helperText={`Max: ${maxQuantity} ${getDisplayUnit()}`} />

          <Select label="Reason for Usage" options={[{ value: "", label: "Select a reason..." }, ...reasonOptions]} value={reason} onChange={value => handleInputChange("reason", value ?? "")} error={errors.reason} required />

          <Input label="Notes (Optional)" value={notes} onChange={value => handleInputChange("notes", value)} placeholder="Additional notes about this usage" />

          {getNumericQuantity() > 0 && inventoryItem.rawMaterial && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 dark:bg-blue-900/10">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Estimated Value:</span>
                <span className="text-lg font-bold text-blue-900 dark:text-blue-300">
                  $
                  {(() => {
                    const qty = getNumericQuantity();
                    if (packInfo && isPackOrBox()) {
                      const unitCost = inventoryItem.rawMaterial.unitCost / packInfo.unitsPerPack;
                      return (qty * unitCost).toFixed(2);
                    } else {
                      return (qty * inventoryItem.rawMaterial.unitCost).toFixed(2);
                    }
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-600 dark:text-blue-400">Remaining after usage:</span>
                <div className="text-right">
                  {isPackOrBox() && packInfo ? (
                    <>
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        {remainingAfterUsage} {packInfo.baseUnit}
                      </span>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        ({(remainingAfterUsage / packInfo.unitsPerPack).toFixed(2)} {inventoryItem.rawMaterial.unit} total)
                      </div>
                    </>
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

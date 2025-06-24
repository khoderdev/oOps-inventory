import { useEffect, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useRawMaterials } from "../../hooks/useRawMaterials";
import { useCreateStockEntry } from "../../hooks/useStock";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

interface StockEntryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const StockEntryForm = ({ onSuccess, onCancel }: StockEntryFormProps) => {
  const [formData, setFormData] = useState({
    rawMaterialId: "",
    quantity: 0,
    unitCost: 0,
    supplier: "",
    batchNumber: "",
    expiryDate: "",
    receivedDate: new Date().toISOString().split("T")[0],
    notes: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: rawMaterials = [] } = useRawMaterials({ isActive: true });
  const { state } = useApp();
  const createMutation = useCreateStockEntry();

  const materialOptions = rawMaterials.map(material => ({
    value: material.id,
    label: `${material.name} (${material.unit})`
  }));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.rawMaterialId) {
      newErrors.rawMaterialId = "Material is required";
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (formData.unitCost <= 0) {
      newErrors.unitCost = "Unit cost must be greater than 0";
    }

    if (!formData.receivedDate) {
      newErrors.receivedDate = "Received date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createMutation.mutateAsync({
        rawMaterialId: formData.rawMaterialId,
        quantity: formData.quantity,
        unitCost: formData.unitCost,
        supplier: formData.supplier || undefined,
        batchNumber: formData.batchNumber || undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        receivedDate: new Date(formData.receivedDate as string),
        receivedBy: state.user?.name || "Unknown",
        notes: formData.notes || undefined
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating stock entry:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const selectedMaterial = rawMaterials.find(m => m.id === formData.rawMaterialId);

  useEffect(() => {
    if (selectedMaterial && formData.unitCost === 0) {
      setFormData(prev => ({ ...prev, unitCost: selectedMaterial.unitCost }));
    }
  }, [selectedMaterial, formData.unitCost]);

  const isLoading = createMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select label="Raw Material" options={materialOptions} value={formData.rawMaterialId} onChange={e => handleInputChange("rawMaterialId", e.target.value)} error={errors.rawMaterialId} required placeholder="Select a material" />

        <Input label="Quantity" type="number" min="0" step="0.01" value={formData.quantity} onChange={e => handleInputChange("quantity", parseFloat(e.target.value) || 0)} error={errors.quantity} required helperText={selectedMaterial ? `Unit: ${selectedMaterial.unit}` : undefined} />

        <Input label="Unit Cost" type="number" step="0.01" min="0" value={formData.unitCost} onChange={e => handleInputChange("unitCost", parseFloat(e.target.value) || 0)} error={errors.unitCost} required placeholder="0.00" />

        <Input label="Supplier" value={formData.supplier} onChange={e => handleInputChange("supplier", e.target.value)} placeholder="e.g., Fresh Foods Inc." />

        <Input label="Batch Number" value={formData.batchNumber} onChange={e => handleInputChange("batchNumber", e.target.value)} placeholder="Optional batch/lot number" />

        <Input label="Received Date" type="date" value={formData.receivedDate} onChange={e => handleInputChange("receivedDate", e.target.value)} error={errors.receivedDate} required />

        <Input label="Expiry Date" type="date" value={formData.expiryDate} onChange={e => handleInputChange("expiryDate", e.target.value)} helperText="Optional expiry date" />

        <div></div>
      </div>

      <Input label="Notes" value={formData.notes} onChange={e => handleInputChange("notes", e.target.value)} placeholder="Optional notes about this stock entry" />

      {/* Total Cost Display */}
      {formData.quantity > 0 && formData.unitCost > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Cost:</span>
            <span className="text-lg font-bold text-gray-900">${(formData.quantity * formData.unitCost).toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          Add Stock Entry
        </Button>
      </div>
    </form>
  );
};

export default StockEntryForm;

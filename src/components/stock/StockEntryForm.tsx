import { Check, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useRawMaterials } from "../../hooks/useRawMaterials";
import { useCreateStockEntry, useStockEntries } from "../../hooks/useStock";
import type { StockEntryFormProps } from "../../types/stock.types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

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
  const [showNewSupplierInput, setShowNewSupplierInput] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [supplierOptions, setSupplierOptions] = useState<Array<{ value: string; label: string }>>([]);

  const { data: rawMaterials = [] } = useRawMaterials({ isActive: true });
  const { data: stockEntries = [] } = useStockEntries();
  const { state } = useApp();
  const createMutation = useCreateStockEntry();

  const materialOptions = rawMaterials.map(material => ({
    value: material.id,
    label: `${material.name} (${material.unit})`
  }));

  // Get unique suppliers from existing stock entries and raw materials
  const existingSuppliers = useMemo(() => {
    const suppliers = new Set<string>();

    // Add suppliers from raw materials
    rawMaterials.forEach(material => {
      if (material.supplier) {
        suppliers.add(material.supplier);
      }
    });

    // Add suppliers from stock entries
    stockEntries.forEach(entry => {
      if (entry.supplier) {
        suppliers.add(entry.supplier);
      }
    });

    return Array.from(suppliers).sort();
  }, [rawMaterials, stockEntries]);

  // Update supplier options when existing suppliers change
  useEffect(() => {
    const options = existingSuppliers.map(supplier => ({
      value: supplier,
      label: supplier
    }));
    setSupplierOptions(options);
  }, [existingSuppliers]);

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
        receivedDate: new Date(formData.receivedDate!),
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

  const handleMaterialChange = (materialId: string) => {
    const material = rawMaterials.find(m => m.id === materialId);

    setFormData(prev => ({
      ...prev,
      rawMaterialId: materialId,
      // Auto-load default supplier from raw material
      supplier: material?.supplier || prev.supplier,
      // Auto-load unit cost if not set
      unitCost: prev.unitCost === 0 && material ? material.unitCost : prev.unitCost
    }));

    // Clear material error
    if (errors.rawMaterialId) {
      setErrors(prev => ({ ...prev, rawMaterialId: "" }));
    }
  };

  const handleAddNewSupplier = () => {
    if (newSupplierName.trim()) {
      // Add to form data
      setFormData(prev => ({ ...prev, supplier: newSupplierName.trim() }));

      // Add to supplier options for future use
      const newOption = { value: newSupplierName.trim(), label: newSupplierName.trim() };
      setSupplierOptions(prev => [...prev, newOption].sort((a, b) => a.label.localeCompare(b.label)));

      // Reset new supplier input
      setNewSupplierName("");
      setShowNewSupplierInput(false);
    }
  };

  const handleCancelNewSupplier = () => {
    setNewSupplierName("");
    setShowNewSupplierInput(false);
  };

  const selectedMaterial = rawMaterials.find(m => m.id === formData.rawMaterialId);
  const isLoading = createMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select label="Raw Material" options={materialOptions} value={formData.rawMaterialId} onChange={e => handleMaterialChange(e.target.value)} error={errors.rawMaterialId} required placeholder="Select a material" />

        <Input label="Quantity" type="number" min="0" step="0.01" value={formData.quantity} onChange={e => handleInputChange("quantity", parseFloat(e.target.value) || 0)} error={errors.quantity} required helperText={selectedMaterial ? `Unit: ${selectedMaterial.unit}` : undefined} />

        <Input label="Unit Cost" type="number" step="0.01" min="0" value={formData.unitCost} onChange={e => handleInputChange("unitCost", parseFloat(e.target.value) || 0)} error={errors.unitCost} required placeholder="0.00" />

        {/* Enhanced Supplier Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Supplier
            {selectedMaterial?.supplier && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(Default: {selectedMaterial.supplier})</span>}
          </label>

          {!showNewSupplierInput ? (
            <div className="flex space-x-2">
              <div className="flex-1">
                <Select options={[{ value: "", label: "Select or type supplier..." }, ...supplierOptions]} value={formData.supplier} onChange={e => handleInputChange("supplier", e.target.value)} placeholder="Choose existing supplier" />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowNewSupplierInput(true)} leftIcon={<Plus className="w-3 h-3" />} title="Add new supplier">
                New
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  value={newSupplierName}
                  onChange={e => setNewSupplierName(e.target.value)}
                  placeholder="Enter new supplier name"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNewSupplier();
                    } else if (e.key === "Escape") {
                      handleCancelNewSupplier();
                    }
                  }}
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddNewSupplier} disabled={!newSupplierName.trim()} leftIcon={<Check className="w-3 h-3" />} title="Add supplier">
                Add
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelNewSupplier} leftIcon={<X className="w-3 h-3" />} title="Cancel">
                Cancel
              </Button>
            </div>
          )}

          {!showNewSupplierInput && (
            <div className="flex space-x-2">
              <Input value={formData.supplier} onChange={e => handleInputChange("supplier", e.target.value)} placeholder="Or type supplier name directly" className="text-sm" />
            </div>
          )}
        </div>

        <Input label="Batch Number" value={formData.batchNumber} onChange={e => handleInputChange("batchNumber", e.target.value)} placeholder="Optional batch/lot number" />

        <Input label="Received Date" type="date" value={formData.receivedDate} onChange={e => handleInputChange("receivedDate", e.target.value)} error={errors.receivedDate} required />

        <Input label="Expiry Date" type="date" value={formData.expiryDate} onChange={e => handleInputChange("expiryDate", e.target.value)} helperText="Optional expiry date" />

        <div></div>
      </div>

      <Input label="Notes" value={formData.notes} onChange={e => handleInputChange("notes", e.target.value)} placeholder="Optional notes about this stock entry" />

      {/* Total Cost Display */}
      {formData.quantity > 0 && formData.unitCost > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Cost:</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">${(formData.quantity * formData.unitCost).toFixed(2)}</span>
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

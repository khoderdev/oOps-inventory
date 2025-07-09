import { Check, Plus, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useRawMaterials } from "../../hooks/useRawMaterials";
import { useCreateStockEntry, useUpdateStockEntry } from "../../hooks/useStock";
import { useCreateSupplier, useSuppliers } from "../../hooks/useSuppliers";
import { MeasurementUnit } from "../../types/rawMaterials.types";
import type { StockEntry } from "../../types/stock.types";
import type { CreateSupplierRequest } from "../../types/suppliers.types";
import { SupplierForm } from "../forms/SupplierForm";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

interface StockEntryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ExtendedStockEntryFormProps extends StockEntryFormProps {
  initialData?: StockEntry;
}

const StockEntryForm = ({ onSuccess, onCancel, initialData }: ExtendedStockEntryFormProps) => {
  const [formData, setFormData] = useState({
    rawMaterialId: "", // Will be converted to number when submitting
    quantity: 0,
    unitCost: 0,
    supplier: "",
    newSupplierName: "", // For storing the name of a new supplier
    batchNumber: "",
    expiryDate: "",
    productionDate: "",
    receivedDate: new Date().toISOString().split("T")[0],
    notes: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNewSupplierInput, setShowNewSupplierInput] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const createSupplier = useCreateSupplier();
  const [newSupplierName, setNewSupplierName] = useState("");
  const { data: rawMaterials = [] } = useRawMaterials({ isActive: true });
  const { data: suppliersData } = useSuppliers();
  const { state } = useApp();
  const createMutation = useCreateStockEntry();
  const updateMutation = useUpdateStockEntry();

  // Extract suppliers array from the API response using useMemo to avoid re-renders
  const suppliers = useMemo(() => {
    // The API returns a PaginatedSuppliers object with suppliers array inside
    if (suppliersData && "suppliers" in suppliersData) {
      return suppliersData.suppliers;
    }
    // Fallback for empty response
    return [];
  }, [suppliersData]);

  // Helper function to get supplier name by ID
  const getSupplierNameById = (supplierId: string): string | undefined => {
    if (!supplierId) return undefined;
    const supplier = suppliers.find(s => s.id.toString() === supplierId);
    return supplier ? supplier.name : undefined;
  };

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      const receivedDateString = initialData.receivedDate ? new Date(initialData.receivedDate).toISOString().split("T")[0] || new Date().toISOString().split("T")[0] || "" : new Date().toISOString().split("T")[0] || "";

      // Find supplier ID by name
      const supplierName = initialData.supplier || "";
      const supplierMatch = suppliers.find(s => s.name === supplierName);
      const supplierId = supplierMatch ? supplierMatch.id.toString() : "";

      setFormData({
        rawMaterialId: initialData.rawMaterialId.toString(),
        quantity: initialData.quantity,
        unitCost: initialData.unitCost,
        supplier: supplierId,
        newSupplierName: supplierMatch ? "" : supplierName,
        batchNumber: initialData.batchNumber || "",
        expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate).toISOString().split("T")[0] || "" : "",
        productionDate: initialData.productionDate ? new Date(initialData.productionDate).toISOString().split("T")[0] || "" : "",
        receivedDate: receivedDateString,
        notes: initialData.notes || ""
      });
    }
  }, [initialData, suppliers]);

  const materialOptions = rawMaterials.map(material => ({
    value: material.id.toString(),
    label: `${material.name} (${material.unit})`
  }));

  // Get supplier options from the suppliers data
  const supplierOptions = useMemo(() => {
    if (!suppliers || suppliers.length === 0) return [];

    return suppliers.map(supplier => ({
      value: supplier.id.toString(),
      label: supplier.name
    }));
  }, [suppliers]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.rawMaterialId) {
      newErrors.rawMaterialId = "Material is required";
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (!formData.receivedDate) {
      newErrors.receivedDate = "Received date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          rawMaterialId: parseInt(formData.rawMaterialId, 10),
          quantity: formData.quantity,
          unitCost: formData.unitCost,
          totalCost: formData.quantity * formData.unitCost,
          supplier: formData.supplier.startsWith("new-") ? formData.newSupplierName : getSupplierNameById(formData.supplier),
          batchNumber: formData.batchNumber || undefined,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
          productionDate: formData.productionDate ? new Date(formData.productionDate) : undefined,
          receivedDate: new Date(formData.receivedDate!),
          receivedById: parseInt(state.user?.id || "1", 10),
          notes: formData.notes || undefined
        });
      } else {
        await createMutation.mutateAsync({
          rawMaterialId: parseInt(formData.rawMaterialId, 10),
          quantity: formData.quantity,
          unitCost: formData.unitCost,
          totalCost: formData.quantity * formData.unitCost,
          supplier: formData.supplier.startsWith("new-") ? formData.newSupplierName : getSupplierNameById(formData.supplier),
          batchNumber: formData.batchNumber || undefined,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
          productionDate: formData.productionDate ? new Date(formData.productionDate) : undefined,
          receivedDate: new Date(formData.receivedDate!),
          receivedById: parseInt(state.user?.id || "1", 10),
          notes: formData.notes || undefined
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error creating stock entry:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleMaterialChange = (materialId: string) => {
    const material = rawMaterials.find(m => m.id === parseInt(materialId, 10));
    if (material) {
      // If material has a supplier, find its ID from the suppliers list
      let supplierId = "";
      if (material.supplier) {
        const supplierMatch = suppliers.find(s => s.name === material.supplier);
        supplierId = supplierMatch ? supplierMatch.id.toString() : "";
      }

      setFormData(prev => ({
        ...prev,
        rawMaterialId: materialId,
        supplier: supplierId, // Use the supplier from raw material as recommended in memory
        unitCost: material.unitCost // Use the unit cost from raw material
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        rawMaterialId: materialId
      }));
    }
    if (errors.rawMaterialId) {
      setErrors(prev => ({ ...prev, rawMaterialId: "" }));
    }
  };

  const handleCreateSupplier = async (data: CreateSupplierRequest) => {
    try {
      // Create the supplier and get the response
      const response = await createSupplier.mutateAsync(data);

      // Close the modal
      setShowCreateModal(false);

      // If we have a successful response with the new supplier data
      if (response && response.id) {
        // Select the newly created supplier
        setFormData(prev => ({
          ...prev,
          supplier: response.id.toString()
        }));
      }
    } catch (error) {
      console.error("Failed to create supplier:", error);
    }
  };

  const handleAddNewSupplier = (): void => {
    if (newSupplierName.trim()) {
      // For new suppliers, we'll use the name as a temporary ID
      // The backend will handle creating a proper supplier if needed
      const tempId = `new-${Date.now()}`;

      // Add to form data - we'll use the temporary ID as the value
      setFormData(prev => ({ ...prev, supplier: tempId, newSupplierName: newSupplierName.trim() }));

      // Reset new supplier input
      setNewSupplierName("");
      setShowNewSupplierInput(false);
    }
  };

  const handleCancelNewSupplier = (): void => {
    setNewSupplierName("");
    setShowNewSupplierInput(false);
  };

  const selectedMaterial = rawMaterials.find(m => m.id === Number(formData.rawMaterialId));

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select label="Raw Material" options={materialOptions} value={formData.rawMaterialId} onChange={value => value && handleMaterialChange(value)} error={errors.rawMaterialId} required placeholder="Select a material" />

          <Input label="Quantity" type="number" min="0" step="0.01" value={formData.quantity} onValueChange={e => handleInputChange("quantity", parseFloat(e) || 0)} error={errors.quantity} required helperText={selectedMaterial ? `Unit: ${selectedMaterial.unit}` : undefined} />

          <Input label="Unit Cost" type="number" step="0.01" min="0" value={formData.unitCost} onValueChange={e => handleInputChange("unitCost", parseFloat(e) || 0)} error={errors.unitCost} placeholder="0.00" helperText={selectedMaterial ? `Auto-filled from material (${selectedMaterial.unit === MeasurementUnit.PACKS || selectedMaterial.unit === MeasurementUnit.BOXES ? `Cost per ${selectedMaterial.unit.toLowerCase()}` : "Unit cost"})` : "Will be auto-filled when material is selected"} />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Supplier
              {selectedMaterial?.supplier && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(Default: {selectedMaterial.supplier})</span>}
            </label>

            {!showNewSupplierInput ? (
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Select options={[{ value: "", label: "Select a supplier..." }, ...supplierOptions]} value={formData.supplier} onChange={value => handleInputChange("supplier", value ?? "")} placeholder="Choose existing supplier" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.preventDefault();
                    setShowCreateModal(true);
                  }}
                  leftIcon={<Plus className="w-3 h-3" />}
                  title="Add new supplier"
                >
                  New
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    value={newSupplierName}
                    onValueChange={e => setNewSupplierName(e)}
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

            {!showNewSupplierInput && formData.supplier && formData.supplier.startsWith("new-") && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                Using new supplier: <strong>{formData.newSupplierName}</strong>
              </div>
            )}
          </div>

          <Input label="Batch Number" value={formData.batchNumber} onValueChange={e => handleInputChange("batchNumber", e)} placeholder="Optional batch/lot number" />

          <Input label="Received Date" type="date" value={formData.receivedDate} onValueChange={e => handleInputChange("receivedDate", e)} error={errors.receivedDate} required />

          <Input label="Production Date" type="date" value={formData.productionDate} onValueChange={e => handleInputChange("productionDate", e)} helperText="Optional production/manufacturing date" />

          <Input label="Expiry Date" type="date" value={formData.expiryDate} onValueChange={e => handleInputChange("expiryDate", e)} helperText="Optional expiry date" />

          <div></div>
        </div>

        <Input label="Notes" value={formData.notes} onValueChange={e => handleInputChange("notes", e)} placeholder="Optional notes about this stock entry" />

        {selectedMaterial && (selectedMaterial.unit === MeasurementUnit.PACKS || selectedMaterial.unit === MeasurementUnit.BOXES) && formData.quantity > 0 && formData.unitCost > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Cost Breakdown</h4>
            <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <p>
                Cost per {selectedMaterial.unit.toLowerCase()}: <strong>${formData.unitCost.toFixed(2)}</strong>
              </p>
              <p>
                Total {selectedMaterial.unit.toLowerCase()} cost: <strong>${(formData.quantity * formData.unitCost).toFixed(2)}</strong>
              </p>
              {(() => {
                const packInfo = selectedMaterial as unknown as { unitsPerPack?: number; baseUnit?: string };
                const unitsPerPack = packInfo.unitsPerPack || 1;
                const baseUnit = packInfo.baseUnit || "pieces";
                const individualCost = formData.unitCost / unitsPerPack;
                const totalIndividualCost = formData.quantity * unitsPerPack * individualCost;
                return (
                  <>
                    <p>
                      Cost per {baseUnit.toLowerCase()}: <strong>${individualCost.toFixed(4)}</strong>
                    </p>
                    <p>
                      Total {baseUnit.toLowerCase()} cost: <strong>${totalIndividualCost.toFixed(2)}</strong>
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {formData.quantity > 0 && formData.unitCost > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Cost:</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">${(formData.quantity * formData.unitCost).toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
            {initialData ? "Update Stock Entry" : "Add Stock Entry"}
          </Button>
        </div>
      </form>

      <Modal isOpen={showCreateModal} onClose={() => !createSupplier.isPending && setShowCreateModal(false)} title="Add New Supplier" size="lg">
        <div className="p-6">
          <SupplierForm onSubmit={handleCreateSupplier} onCancel={() => !createSupplier.isPending && setShowCreateModal(false)} isLoading={createSupplier.isPending} />
        </div>
      </Modal>
    </>
  );
};

export default StockEntryForm;

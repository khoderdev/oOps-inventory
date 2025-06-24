import { useState, useEffect } from "react";
import { useCreateRawMaterial, useUpdateRawMaterial } from "../../hooks/useRawMaterials";
import { MaterialCategory, MeasurementUnit, type RawMaterial } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

interface RawMaterialFormProps {
  initialData?: RawMaterial;
  onSuccess: () => void;
  onCancel: () => void;
}

const RawMaterialForm = ({ initialData, onSuccess, onCancel }: RawMaterialFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: MaterialCategory.OTHER,
    unit: MeasurementUnit.PIECES,
    unitCost: 0,
    supplier: "",
    minStockLevel: 0,
    maxStockLevel: 100
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateRawMaterial();
  const updateMutation = useUpdateRawMaterial();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        category: initialData.category,
        unit: initialData.unit,
        unitCost: initialData.unitCost,
        supplier: initialData.supplier || "",
        minStockLevel: initialData.minStockLevel,
        maxStockLevel: initialData.maxStockLevel
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.unitCost <= 0) {
      newErrors.unitCost = "Unit cost must be greater than 0";
    }

    if (formData.minStockLevel < 0) {
      newErrors.minStockLevel = "Minimum stock level cannot be negative";
    }

    if (formData.maxStockLevel <= formData.minStockLevel) {
      newErrors.maxStockLevel = "Maximum stock level must be greater than minimum";
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
      if (initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          ...formData
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving raw material:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const categoryOptions = Object.values(MaterialCategory).map(category => ({
    value: category,
    label: category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ")
  }));

  const unitOptions = Object.values(MeasurementUnit).map(unit => ({
    value: unit,
    label: unit.toUpperCase()
  }));

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Name" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} error={errors.name} required placeholder="e.g., Fresh Beef, Organic Tomatoes" />

        <Select label="Category" options={categoryOptions} value={formData.category} onChange={e => handleInputChange("category", e.target.value)} required />

        <Select label="Unit of Measurement" options={unitOptions} value={formData.unit} onChange={e => handleInputChange("unit", e.target.value)} required />

        <Input label="Unit Cost" type="number" step="0.01" min="0" value={formData.unitCost} onChange={e => handleInputChange("unitCost", parseFloat(e.target.value) || 0)} error={errors.unitCost} required placeholder="0.00" />

        <Input label="Supplier" value={formData.supplier} onChange={e => handleInputChange("supplier", e.target.value)} placeholder="e.g., Fresh Foods Inc." />

        <div></div>

        <Input label="Minimum Stock Level" type="number" min="0" value={formData.minStockLevel} onChange={e => handleInputChange("minStockLevel", parseInt(e.target.value) || 0)} error={errors.minStockLevel} required helperText="Alert threshold for low stock" />

        <Input label="Maximum Stock Level" type="number" min="1" value={formData.maxStockLevel} onChange={e => handleInputChange("maxStockLevel", parseInt(e.target.value) || 0)} error={errors.maxStockLevel} required helperText="Target stock level for ordering" />
      </div>

      <Input label="Description" value={formData.description} onChange={e => handleInputChange("description", e.target.value)} placeholder="Optional description or notes" />

      <div className="flex justify-end space-x-3 pt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {initialData ? "Update" : "Create"} Raw Material
        </Button>
      </div>
    </form>
  );
};

export default RawMaterialForm;

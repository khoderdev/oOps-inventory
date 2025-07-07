import { useEffect, useState } from "react";
import { useCreateRawMaterial, useUpdateRawMaterial } from "../../hooks/useRawMaterials";
import { useSuppliers } from "../../hooks/useSuppliers";
import { MaterialCategory, MeasurementUnit, type RawMaterial } from "../../types";
import type { Supplier } from "../../types/suppliers.types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

interface RawMaterialFormProps {
  initialData?: RawMaterial;
  onSuccess: () => void;
  onCancel: () => void;
}

const RawMaterialForm = ({ initialData, onSuccess, onCancel }: RawMaterialFormProps) => {
  const { data: suppliersData } = useSuppliers();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: MaterialCategory.OTHER,
    unit: MeasurementUnit.PIECES,
    unitCost: 0,
    supplierId: null as number | null,
    minStockLevel: 0,
    maxStockLevel: 100,
    unitsPerPack: 1,
    baseUnit: MeasurementUnit.PIECES
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateRawMaterial();
  const updateMutation = useUpdateRawMaterial();

  useEffect(() => {
    if (initialData) {
      const normalizeCategory = (category: string): MaterialCategory => {
        const categoryKey = category.toUpperCase() as keyof typeof MaterialCategory;
        return MaterialCategory[categoryKey] || MaterialCategory.OTHER;
      };

      const normalizeUnit = (unit: string): MeasurementUnit => {
        const unitKey = unit.toUpperCase() as keyof typeof MeasurementUnit;
        return MeasurementUnit[unitKey] || MeasurementUnit.PIECES;
      };

      // Handle supplier ID from different possible sources
      let supplierId: number | null = null;

      // First check direct supplier field (string ID from API)
      if (initialData.supplier) {
        const parsedId = parseInt(initialData.supplier);
        if (!isNaN(parsedId)) {
          supplierId = parsedId;
        }
      }

      // Fallback to supplierMaterials if available
      if (supplierId === null && initialData.supplierMaterials && initialData.supplierMaterials.length > 0) {
        supplierId = initialData.supplierMaterials[0]?.supplier_id || null;
      }

      const newFormData = {
        name: initialData.name || "",
        description: initialData.description || "",
        category: normalizeCategory(initialData.category as string),
        unit: normalizeUnit(initialData.unit as string),
        unitCost: initialData.unitCost || 0,
        supplierId: supplierId,
        minStockLevel: initialData.minStockLevel || 0,
        maxStockLevel: initialData.maxStockLevel || 100,
        unitsPerPack: initialData.unitsPerPack || 1,
        baseUnit: initialData.baseUnit ? normalizeUnit(initialData.baseUnit as string) : MeasurementUnit.PIECES
      };

      setFormData(newFormData);
    } else {
      // Reset form when no initial data (for create mode)
      const resetFormData = {
        name: "",
        description: "",
        category: MaterialCategory.OTHER,
        unit: MeasurementUnit.PIECES,
        unitCost: 0,
        supplierId: null,
        minStockLevel: 0,
        maxStockLevel: 100,
        unitsPerPack: 1,
        baseUnit: MeasurementUnit.PIECES
      };

      setFormData(resetFormData);
    }
    // Clear any existing errors when data changes
    setErrors({});
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

    if (formData.supplierId === null) {
      newErrors.supplierId = "Please select a supplier";
    }

    // Validate pack/box specific fields
    if (isPackOrBox() && formData.unitsPerPack <= 0) {
      newErrors.unitsPerPack = "Units per pack/box must be greater than 0";
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
      // Convert form data to API format
      const convertToApiFormat = () => {
        return {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          unit: formData.unit,
          unitCost: formData.unitCost,
          supplier: formData.supplierId?.toString(),
          minStockLevel: formData.minStockLevel,
          maxStockLevel: formData.maxStockLevel,
          baseUnit: isPackOrBox() ? formData.baseUnit : null,
          unitsPerPack: isPackOrBox() ? formData.unitsPerPack : null
        };
      };

      const submitData = convertToApiFormat();

      if (initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          ...submitData
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving raw material:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const isPackOrBox = () => {
    return formData.unit === MeasurementUnit.PACKS || formData.unit === MeasurementUnit.BOXES;
  };

  const categoryOptions = Object.values(MaterialCategory).map(category => ({
    value: category,
    label: category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ")
  }));

  const unitOptions = Object.values(MeasurementUnit).map(unit => ({
    value: unit,
    label: unit.toUpperCase()
  }));

  const baseUnitOptions = Object.values(MeasurementUnit)
    .filter(unit => unit !== MeasurementUnit.PACKS && unit !== MeasurementUnit.BOXES)
    .map(unit => ({
      value: unit,
      label: unit.toUpperCase()
    }));

  const supplierOptions =
    suppliersData?.suppliers?.map((supplier: Supplier) => ({
      value: supplier.id,
      label: supplier.name
    })) || [];

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const getPackLabel = () => {
    return formData.unit === MeasurementUnit.PACKS ? "pack" : "box";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Name" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} error={errors.name} required placeholder="e.g., Fresh Beef, Organic Tomatoes" />

        <Select key={`category-${formData.category}`} label="Category" options={categoryOptions} value={formData.category} onChange={value => handleInputChange("category", value)} required />

        <Select key={`unit-${formData.unit}`} label="Unit of Measurement" options={unitOptions} value={formData.unit} onChange={value => handleInputChange("unit", value)} required />

        <Input label="Unit Cost" type="number" step="0.01" min="0" value={formData.unitCost} onChange={e => handleInputChange("unitCost", parseFloat(e.target.value) || 0)} error={errors.unitCost} required placeholder="0.00" />

        {/* Pack/Box specific fields */}
        {isPackOrBox() && (
          <>
            <Input label={`Units per ${getPackLabel()}`} type="number" min="1" value={formData.unitsPerPack} onChange={e => handleInputChange("unitsPerPack", parseInt(e.target.value) || 1)} error={errors.unitsPerPack} required placeholder="e.g., 12" helperText={`How many individual units are in each ${getPackLabel()}?`} />

            <Select key={`baseUnit-${formData.baseUnit}`} label="Base unit (individual items)" options={baseUnitOptions} value={formData.baseUnit} onChange={value => handleInputChange("baseUnit", value)} required helperText={`What unit are the individual items measured in?`} />
          </>
        )}

        <Select<number> label="Supplier" options={supplierOptions} value={formData.supplierId} onChange={value => handleInputChange("supplierId", value)} error={errors.supplierId} required placeholder="Select a supplier" />

        {!isPackOrBox() && <div></div>}

        <Input label="Minimum Stock Level" type="number" min="0" value={formData.minStockLevel} onChange={e => handleInputChange("minStockLevel", parseInt(e.target.value) || 0)} error={errors.minStockLevel} required helperText="Alert threshold for low stock" />

        <Input label="Maximum Stock Level" type="number" min="1" value={formData.maxStockLevel} onChange={e => handleInputChange("maxStockLevel", parseInt(e.target.value) || 0)} error={errors.maxStockLevel} required helperText="Target stock level for ordering" />
      </div>

      <Input label="Description" value={formData.description} onChange={e => handleInputChange("description", e.target.value)} placeholder="Optional description or notes" />

      {/* Pack/Box Summary */}
      {isPackOrBox() && formData.unitsPerPack > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg dark:bg-blue-900">
          <h4 className="font-medium text-blue-900 mb-2 dark:text-blue-100">Pack/Box Summary</h4>
          <p className="text-sm text-blue-700 dark:text-blue-100">
            Each {getPackLabel()} contains <strong>{formData.unitsPerPack}</strong> {formData.baseUnit.toLowerCase()}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-100">
            Cost per {getPackLabel()}: <strong>${formData.unitCost.toFixed(2)}</strong>
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-100">
            Cost per individual {formData.baseUnit.toLowerCase()}: <strong>${(formData.unitCost / formData.unitsPerPack).toFixed(4)}</strong>
          </p>
        </div>
      )}

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

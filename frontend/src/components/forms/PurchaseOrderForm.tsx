import React, { useState } from "react";
import { useCreatePurchaseOrder } from "../../hooks/usePurchaseOrders";
import type { CreatePurchaseOrderItem, CreatePurchaseOrderRequest, RawMaterial, SupplierType } from "../../types";
import { formatCurrency } from "../../utils/quantity";
import { Button, Input, Select } from "../ui";

interface PurchaseOrderFormProps {
  suppliers: SupplierType[];
  rawMaterials: RawMaterial[];
  onSuccess: () => void;
  onCancel: () => void;
  prefilledMaterial?: RawMaterial;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ suppliers, rawMaterials, onSuccess, onCancel, prefilledMaterial }) => {
  const createPurchaseOrder = useCreatePurchaseOrder();

  const [formData, setFormData] = useState<Omit<CreatePurchaseOrderRequest, "order_items">>({
    supplier_id: 0,
    order_date: new Date().toISOString().split("T")[0] || "",
    expected_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] || "",
    notes: ""
  });

  const [orderItems, setOrderItems] = useState<CreatePurchaseOrderItem[]>(
    prefilledMaterial
      ? [
          {
            raw_material_id: prefilledMaterial.id,
            quantity_ordered: 0,
            unit_price: prefilledMaterial.unitCost || 0,
            notes: ""
          }
        ]
      : [
          {
            raw_material_id: 0,
            quantity_ordered: 0,
            unit_price: 0,
            notes: ""
          }
        ]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplier_id) {
      newErrors.supplier_id = "Please select a supplier";
    }

    if (!formData.order_date) {
      newErrors.order_date = "Order date is required";
    }

    if (!formData.expected_date) {
      newErrors.expected_date = "Expected delivery date is required";
    }

    if (new Date(formData.expected_date) < new Date(formData.order_date)) {
      newErrors.expected_date = "Expected date must be after order date";
    }

    if (orderItems.length === 0) {
      newErrors.items = "At least one item is required";
    }

    orderItems.forEach((item, index) => {
      if (!item.raw_material_id) {
        newErrors[`item_${index}_material`] = "Please select a material";
      }
      if (!item.quantity_ordered || item.quantity_ordered <= 0) {
        newErrors[`item_${index}_quantity`] = "Quantity must be greater than 0";
      }
      if (!item.unit_cost || item.unit_cost <= 0) {
        newErrors[`item_${index}_price`] = "Unit price must be greater than 0";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      {
        raw_material_id: 0,
        quantity_ordered: 0,
        unit_cost: 0,
        notes: ""
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CreatePurchaseOrderItem, value: any) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Auto-fill unit price when material is selected
    if (field === "raw_material_id") {
      const material = rawMaterials.find(m => m.id === value);
      if (material && material.unitCost) {
        updatedItems[index].unit_cost = material.unitCost;
      }
    }

    setOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.quantity_ordered * item.unit_cost, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const purchaseOrderData: CreatePurchaseOrderRequest = {
        ...formData,
        order_items: orderItems.filter(item => item.raw_material_id && item.quantity_ordered > 0)
      };

      await createPurchaseOrder.mutateAsync(purchaseOrderData);
      onSuccess();
    } catch (error) {
      console.error("Failed to create purchase order:", error);
      setErrors({ submit: "Failed to create purchase order. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supplier <span className="text-red-500">*</span>
          </label>
          <Select value={formData.supplier_id.toString()} onChange={value => setFormData({ ...formData, supplier_id: parseInt(value) })} error={errors.supplier_id} required>
            <option value="">Select a supplier</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
          {selectedSupplier && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Payment Terms: {selectedSupplier.payment_terms} days</p>
              <p>Lead Time: {selectedSupplier.lead_time_days} days</p>
              {selectedSupplier.discount_rate && <p>Discount: {selectedSupplier.discount_rate}%</p>}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Date <span className="text-red-500">*</span>
            </label>
            <Input type="date" value={formData.order_date} onChange={e => setFormData({ ...formData, order_date: e.target.value })} error={errors.order_date} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Delivery Date <span className="text-red-500">*</span>
            </label>
            <Input type="date" value={formData.expected_date} onChange={e => setFormData({ ...formData, expected_date: e.target.value })} error={errors.expected_date} required />
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
          <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
            + Add Item
          </Button>
        </div>

        {errors.items && <div className="mb-4 text-sm text-red-600">{errors.items}</div>}

        <div className="space-y-4">
          {orderItems.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material <span className="text-red-500">*</span>
                  </label>
                  <Select value={item.raw_material_id.toString()} onChange={value => handleItemChange(index, "raw_material_id", parseInt(value))} error={errors[`item_${index}_material`]} disabled={prefilledMaterial && index === 0}>
                    <option value="">Select material</option>
                    {rawMaterials.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.unit})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <Input type="number" min="0" step="0.01" value={item.quantity_ordered} onChange={e => handleItemChange(index, "quantity_ordered", parseFloat(e.target.value) || 0)} error={errors[`item_${index}_quantity`]} placeholder="0.00" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price <span className="text-red-500">*</span>
                  </label>
                  <Input type="number" min="0" step="0.01" value={item.unit_cost} onChange={e => handleItemChange(index, "unit_cost", parseFloat(e.target.value) || 0)} error={errors[`item_${index}_price`]} placeholder="0.00" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                  <div className="h-10 flex items-center px-3 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">{formatCurrency(item.quantity_ordered * item.unit_cost)}</div>
                </div>

                <div className="flex items-end">
                  {orderItems.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveItem(index)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Input value={item.notes} onChange={e => handleItemChange(index, "notes", e.target.value)} placeholder="Additional notes for this item..." />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-gray-900">Total Amount:</span>
          <span className="text-2xl font-bold text-gray-900">{formatCurrency(calculateTotal())}</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes</label>
        <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Additional notes for this purchase order..." />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || orderItems.length === 0} className="min-w-32">
          {isSubmitting ? "Creating..." : "Create Purchase Order"}
        </Button>
      </div>

      {errors.submit && <div className="text-sm text-red-600 text-center">{errors.submit}</div>}
    </form>
  );
};

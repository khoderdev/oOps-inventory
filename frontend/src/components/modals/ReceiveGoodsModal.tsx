import React, { useState } from "react";
import type { PurchaseOrder } from "../../types";
import { formatCurrency } from "../../utils/quantity";
import { Button, Input } from "../ui";

interface ReceiveGoodsModalProps {
  purchaseOrder: PurchaseOrder;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ReceiveItemData {
  purchase_order_item_id: number;
  received_quantity: number;
  quality_rating: number;
  notes: string;
  damaged_quantity: number;
  expiry_date: string;
}

export const ReceiveGoodsModal: React.FC<ReceiveGoodsModalProps> = ({ purchaseOrder, onSuccess, onCancel }) => {
  const [receivedItems, setReceivedItems] = useState<ReceiveItemData[]>(
    purchaseOrder.order_items.map(item => ({
      purchase_order_item_id: item.id as number,
      received_quantity: 0,
      quality_rating: 5,
      notes: "",
      damaged_quantity: 0,
      expiry_date: ""
    }))
  );

  const [formData, setFormData] = useState({
    received_date: new Date().toISOString().split("T")[0],
    received_by: "",
    delivery_note_number: "",
    carrier: "",
    notes: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.received_date) {
      newErrors.received_date = "Received date is required";
    }

    if (!formData.received_by) {
      newErrors.received_by = "Received by is required";
    }

    // Check if at least one item has received quantity
    const hasReceivedItems = receivedItems.some(item => item.received_quantity > 0);
    if (!hasReceivedItems) {
      newErrors.items = "At least one item must have received quantity greater than 0";
    }

    // Validate each item
    receivedItems.forEach((item, index) => {
      const orderItem = purchaseOrder.order_items.find(oi => oi.id === item.purchase_order_item_id);
      if (orderItem && item.received_quantity > orderItem.quantity_ordered - orderItem.quantity_received) {
        newErrors[`item_${index}_quantity`] = "Received quantity cannot exceed remaining quantity";
      }

      if (item.damaged_quantity && item.damaged_quantity > item.received_quantity) {
        newErrors[`item_${index}_damaged`] = "Damaged quantity cannot exceed received quantity";
      }

      if (item.quality_rating < 1 || item.quality_rating > 5) {
        newErrors[`item_${index}_quality`] = "Quality rating must be between 1 and 5";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleItemChange = (index: number, field: keyof ReceiveItemData, value: string | number) => {
    const updatedItems = [...receivedItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setReceivedItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const receiveData = {
        purchase_order_id: purchaseOrder.id,
        received_date: formData.received_date,
        received_by: formData.received_by,
        delivery_note_number: formData.delivery_note_number,
        carrier: formData.carrier,
        notes: formData.notes,
        items: receivedItems.filter(item => item.received_quantity > 0)
      };

      console.log("Would submit receive goods data:", receiveData);

      await new Promise(resolve => setTimeout(resolve, 1000));

      onSuccess();
    } catch (error) {
      console.error("Failed to receive goods:", error);
      setErrors({ submit: "Failed to receive goods. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalReceived = () => {
    return receivedItems.reduce((total, item) => {
      const orderItem = purchaseOrder.order_items.find(oi => oi.id === item.purchase_order_item_id);
      return total + item.received_quantity * (orderItem?.unit_cost || 0);
    }, 0);
  };

  const getQualityColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Purchase Order Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Purchase Order: {purchaseOrder.po_number}</h3>
            <p className="text-sm text-gray-600">Supplier: {purchaseOrder.supplier?.name}</p>
            <p className="text-sm text-gray-600">Order Date: {new Date(purchaseOrder.order_date).toLocaleDateString()}</p>
            <p className="text-sm text-gray-600">Expected: {new Date(purchaseOrder.expected_date).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(purchaseOrder.total_amount)}</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${purchaseOrder.status === "SENT" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>{purchaseOrder.status}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Delivery Information */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Delivery Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Received Date <span className="text-red-500">*</span>
              </label>
              <Input type="date" value={formData.received_date} onChange={e => setFormData({ ...formData, received_date: e.target.value })} error={errors.received_date} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Received By <span className="text-red-500">*</span>
              </label>
              <Input value={formData.received_by} onChange={e => setFormData({ ...formData, received_by: e.target.value })} placeholder="Staff member who received the goods" error={errors.received_by} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Note Number</label>
              <Input value={formData.delivery_note_number} onChange={e => setFormData({ ...formData, delivery_note_number: e.target.value })} placeholder="Delivery note reference" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carrier/Delivery Company</label>
              <Input value={formData.carrier} onChange={e => setFormData({ ...formData, carrier: e.target.value })} placeholder="Name of delivery company" />
            </div>
          </div>
        </div>

        {/* Items to Receive */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Items to Receive</h4>

          {errors.items && <div className="mb-4 text-sm text-red-600">{errors.items}</div>}

          <div className="space-y-4">
            {purchaseOrder.order_items.map((orderItem, index) => {
              const receivedItem = receivedItems[index];
              const remainingQuantity = orderItem.quantity_ordered - orderItem.quantity_received;

              if (!receivedItem) {
                return null;
              }

              return (
                <div key={orderItem.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h5 className="font-medium text-gray-900">{orderItem.raw_material?.name}</h5>
                      <p className="text-sm text-gray-600">
                        Ordered: {orderItem.quantity_ordered} {orderItem.raw_material?.unit} × {formatCurrency(orderItem.unit_cost)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Remaining: {remainingQuantity} {orderItem.raw_material?.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Item Total</p>
                      <p className="font-medium text-gray-900">{formatCurrency(orderItem.line_total)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Received Quantity</label>
                      <Input type="number" min="0" max={remainingQuantity} step="0.01" value={receivedItem.received_quantity} onChange={e => handleItemChange(index, "received_quantity", parseFloat(e.target.value) || 0)} placeholder="0.00" error={errors[`item_${index}_quantity`]} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Damaged Quantity</label>
                      <Input type="number" min="0" max={receivedItem.received_quantity} step="0.01" value={receivedItem.damaged_quantity} onChange={e => handleItemChange(index, "damaged_quantity", parseFloat(e.target.value) || 0)} placeholder="0.00" error={errors[`item_${index}_damaged`]} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quality Rating</label>
                      <select value={receivedItem.quality_rating} onChange={e => handleItemChange(index, "quality_rating", parseInt(e.target.value))} className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${getQualityColor(receivedItem.quality_rating)}`}>
                        <option value={5}>5 - Excellent</option>
                        <option value={4}>4 - Good</option>
                        <option value={3}>3 - Average</option>
                        <option value={2}>2 - Below Average</option>
                        <option value={1}>1 - Poor</option>
                      </select>
                      {errors[`item_${index}_quality`] && <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_quality`]}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <Input type="date" value={receivedItem.expiry_date} onChange={e => handleItemChange(index, "expiry_date", e.target.value)} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Notes</label>
                    <Input value={receivedItem.notes} onChange={e => handleItemChange(index, "notes", e.target.value)} placeholder="Quality issues, condition notes, etc." />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">Total Received Value:</span>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(calculateTotalReceived())}</span>
          </div>
        </div>

        {/* General Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Notes</label>
          <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Overall delivery condition, issues, or observations..." />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-32">
            {isSubmitting ? "Processing..." : "Receive Goods"}
          </Button>
        </div>

        {errors.submit && <div className="text-sm text-red-600 text-center">{errors.submit}</div>}
      </form>
    </div>
  );
};

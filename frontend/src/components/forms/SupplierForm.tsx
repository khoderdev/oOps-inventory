import React, { useEffect, useState } from "react";
import type { CreateSupplierRequest, SupplierType as Supplier } from "../../types";
import { Button, Input } from "../ui";

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSubmit: (data: CreateSupplierRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({ supplier, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<CreateSupplierRequest>({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
    tax_id: "",
    payment_terms: 30,
    discount_rate: 0,
    credit_limit: 0,
    rating: 5,
    lead_time_days: 7,
    minimum_order: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contact_person: supplier.contact_person || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        city: supplier.city || "",
        state: supplier.state || "",
        zip_code: supplier.zip_code || "",
        country: supplier.country || "",
        tax_id: supplier.tax_id || "",
        payment_terms: supplier.payment_terms,
        discount_rate: supplier.discount_rate || 0,
        credit_limit: supplier.credit_limit || 0,
        rating: supplier.rating || 5,
        lead_time_days: supplier.lead_time_days,
        minimum_order: supplier.minimum_order || 0
      });
    }
  }, [supplier]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Supplier name is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof CreateSupplierRequest, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Supplier Name *</label>
          <Input type="text" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} required />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Contact Person</label>
          <Input type="text" value={formData.contact_person || ""} onChange={e => handleInputChange("contact_person", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Email</label>
          <Input type="email" value={formData.email || ""} onChange={e => handleInputChange("email", e.target.value)} />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Phone</label>
          <Input type="tel" value={formData.phone || ""} onChange={e => handleInputChange("phone", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Payment Terms (days)</label>
          <Input type="number" value={formData.payment_terms || ""} onChange={e => handleInputChange("payment_terms", parseInt(e.target.value) || undefined)} min="0" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Lead Time (days)</label>
          <Input type="number" value={formData.lead_time_days || ""} onChange={e => handleInputChange("lead_time_days", parseInt(e.target.value) || undefined)} min="0" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : supplier ? "Update Supplier" : "Create Supplier"}
        </Button>
      </div>
    </form>
  );
};

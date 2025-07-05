import React, { useEffect, useState } from "react";
import type { Budget, BudgetPeriod, CreateBudgetRequest } from "../../types";
import { BudgetPeriodLabels } from "../../types";
import { Button } from "../ui";

interface BudgetFormProps {
  budget?: Budget | null;
  onSubmit: (data: CreateBudgetRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({ budget, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<CreateBudgetRequest>({
    name: "",
    description: "",
    period_type: "MONTHLY" as BudgetPeriod,
    start_date: "",
    end_date: "",
    total_budget: 0,
    allocations: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name,
        description: budget.description || "",
        period_type: budget.period_type,
        start_date: (budget.start_date || "").split("T")[0] || "",
        end_date: (budget.end_date || "").split("T")[0] || "",
        total_budget: budget.total_budget,
        allocations: budget.allocations.map(alloc => ({
          category: alloc.category,
          allocated_amount: alloc.allocated_amount,
          notes: alloc.notes
        }))
      });
    }
  }, [budget]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Budget name is required";
    }

    if (!formData.start_date) {
      newErrors.start_date = "Start date is required";
    }

    if (formData.total_budget <= 0) {
      newErrors.total_budget = "Total budget must be greater than 0";
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

  const handleInputChange = (field: keyof CreateBudgetRequest, value: string | number | BudgetPeriod) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget Name *</label>
          <input type="text" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} placeholder="e.g., Q1 2024 Operations Budget" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Period Type *</label>
          <select value={formData.period_type} onChange={e => handleInputChange("period_type", e.target.value as BudgetPeriod)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
            {Object.entries(BudgetPeriodLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={formData.description || ""} onChange={e => handleInputChange("description", e.target.value)} rows={2} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Optional description of the budget" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
          <input type="date" value={formData.start_date} onChange={e => handleInputChange("start_date", e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
          {errors.start_date && <p className="text-sm text-red-600 mt-1">{errors.start_date}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
          <input type="date" value={formData.end_date} onChange={e => handleInputChange("end_date", e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget *</label>
        <input type="number" value={formData.total_budget} onChange={e => handleInputChange("total_budget", parseFloat(e.target.value) || 0)} placeholder="0.00" min="0" step="0.01" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
        {errors.total_budget && <p className="text-sm text-red-600 mt-1">{errors.total_budget}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : budget ? "Update Budget" : "Create Budget"}
        </Button>
      </div>
    </form>
  );
};

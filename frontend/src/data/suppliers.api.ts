import { apiClient, handleApiResponse } from "../lib/api";
import type { CreateSupplierRequest, PaginatedSuppliers, SupplierAnalytics, SupplierComparison, SupplierFilters, SupplierPerformance, SupplierType, UpdateSupplierMaterialRequest } from "../types";

export const suppliersApi = {
  // Get suppliers with filtering
  getSuppliers: async (filters?: SupplierFilters): Promise<PaginatedSuppliers> => {
    const params = new URLSearchParams();

    if (filters?.is_active !== undefined) params.append("is_active", filters.is_active.toString());
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get<PaginatedSuppliers>(`/suppliers?${params.toString()}`);
    return handleApiResponse(response);
  },

  // Get supplier by ID
  getSupplierById: async (id: number): Promise<SupplierType> => {
    const response = await apiClient.get<SupplierType>(`/suppliers/${id}`);
    return handleApiResponse(response);
  },

  // Create new supplier
  createSupplier: async (data: CreateSupplierRequest): Promise<SupplierType> => {
    const response = await apiClient.post<SupplierType>("/suppliers", data);
    return handleApiResponse(response);
  },

  // Update supplier
  updateSupplier: async (id: number, data: Partial<CreateSupplierRequest>): Promise<SupplierType> => {
    const response = await apiClient.put<SupplierType>(`/suppliers/${id}`, data);
    return handleApiResponse(response);
  },

  // Delete supplier (soft delete)
  deleteSupplier: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/suppliers/${id}`);
    return handleApiResponse(response);
  },

  // Get supplier performance metrics
  getSupplierPerformance: async (id: number, days?: number): Promise<SupplierPerformance> => {
    const params = days ? `?days=${days}` : "";
    const response = await apiClient.get<SupplierPerformance>(`/suppliers/${id}/performance${params}`);
    return handleApiResponse(response);
  },

  // Update supplier material pricing
  updateSupplierMaterial: async (data: UpdateSupplierMaterialRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>("/suppliers/materials", data);
    return handleApiResponse(response);
  },

  // Get supplier comparison for a material
  getSupplierComparison: async (materialId: number): Promise<SupplierComparison> => {
    const response = await apiClient.get<SupplierComparison>(`/suppliers/compare/${materialId}`);
    return handleApiResponse(response);
  },

  // Get supplier analytics
  getAnalytics: async (days?: number): Promise<SupplierAnalytics> => {
    const params = days ? `?days=${days}` : "";
    const response = await apiClient.get<SupplierAnalytics>(`/suppliers/analytics${params}`);
    return handleApiResponse(response);
  }
};

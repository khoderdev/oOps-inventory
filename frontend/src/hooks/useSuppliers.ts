import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { suppliersApi } from "../data/suppliers.api";
import type { CreateSupplierRequest, SupplierFilters, UpdateSupplierMaterialRequest } from "../types";

export const useSuppliers = (filters?: SupplierFilters) => {
  return useQuery({
    queryKey: ["suppliers", filters],
    queryFn: () => suppliersApi.getSuppliers(filters),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // Refetch every minute
  });
};

export const useSupplier = (id: number) => {
  return useQuery({
    queryKey: ["supplier", id],
    queryFn: () => suppliersApi.getSupplierById(id),
    enabled: !!id,
    staleTime: 30000
  });
};

export const useSupplierAnalytics = (days?: number) => {
  return useQuery({
    queryKey: ["supplier-analytics", days],
    queryFn: () => suppliersApi.getAnalytics(days),
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000 // Refetch every 5 minutes
  });
};

export const useSupplierPerformance = (id: number, days?: number) => {
  return useQuery({
    queryKey: ["supplier-performance", id, days],
    queryFn: () => suppliersApi.getSupplierPerformance(id, days),
    enabled: !!id,
    staleTime: 300000 // 5 minutes
  });
};

export const useSupplierComparison = (materialId: number) => {
  return useQuery({
    queryKey: ["supplier-comparison", materialId],
    queryFn: () => suppliersApi.getSupplierComparison(materialId),
    enabled: !!materialId,
    staleTime: 300000 // 5 minutes
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierRequest) => suppliersApi.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-analytics"] });
    }
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateSupplierRequest> }) => suppliersApi.updateSupplier(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["supplier-analytics"] });
    }
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => suppliersApi.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-analytics"] });
    }
  });
};

export const useUpdateSupplierMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSupplierMaterialRequest) => suppliersApi.updateSupplierMaterial(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["supplier-comparison", variables.raw_material_id] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    }
  });
};

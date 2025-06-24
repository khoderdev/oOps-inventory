import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RawMaterialsAPI } from "../data/rawMaterials.api";
import type { CreateRawMaterialInput, UpdateRawMaterialInput } from "../types";

const QUERY_KEYS = {
  rawMaterials: "rawMaterials",
  rawMaterial: (id: string) => ["rawMaterial", id],
  lowStock: "rawMaterials-low-stock",
  byCategory: (category: string) => ["rawMaterials", "category", category]
} as const;

// Get all raw materials
export const useRawMaterials = (filters?: { category?: string; isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: [QUERY_KEYS.rawMaterials, filters],
    queryFn: () => RawMaterialsAPI.getAll(filters),
    select: response => response.data,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get single raw material by ID
export const useRawMaterial = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.rawMaterial(id),
    queryFn: () => RawMaterialsAPI.getById(id),
    select: response => response.data,
    enabled: !!id
  });
};

// Get low stock materials
export const useLowStockMaterials = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.lowStock],
    queryFn: () => RawMaterialsAPI.getLowStock(),
    select: response => response.data,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
};

// Get materials by category
export const useRawMaterialsByCategory = (category: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.byCategory(category),
    queryFn: () => RawMaterialsAPI.getByCategory(category),
    select: response => response.data,
    enabled: !!category
  });
};

// Create raw material mutation
export const useCreateRawMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRawMaterialInput) => RawMaterialsAPI.create(data),
    onSuccess: response => {
      if (response.success) {
        // Invalidate and refetch raw materials list
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rawMaterials] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.lowStock] });
      }
    }
  });
};

// Update raw material mutation
export const useUpdateRawMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRawMaterialInput) => RawMaterialsAPI.update(data),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Update specific item in cache
        queryClient.setQueryData(QUERY_KEYS.rawMaterial(variables.id), { data: response.data });
        // Invalidate lists
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rawMaterials] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.lowStock] });
      }
    }
  });
};

// Delete raw material mutation
export const useDeleteRawMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => RawMaterialsAPI.delete(id),
    onSuccess: response => {
      if (response.success) {
        // Invalidate all raw materials queries
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rawMaterials] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.lowStock] });
      }
    }
  });
};

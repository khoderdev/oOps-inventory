import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionsAPI } from "../data/sections.api";
import type { CreateSectionInput, UpdateSectionInput, CreateSectionAssignmentInput } from "../types";

const QUERY_KEYS = {
  sections: "sections",
  section: (id: string) => ["section", id],
  sectionInventory: (sectionId: string) => ["sectionInventory", sectionId],
  sectionConsumption: (sectionId: string) => ["sectionConsumption", sectionId]
} as const;

// Get all sections
export const useSections = (filters?: { type?: string; isActive?: boolean; managerId?: string }) => {
  return useQuery({
    queryKey: [QUERY_KEYS.sections, filters],
    queryFn: () => SectionsAPI.getAll(filters),
    select: response => response.data,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get single section by ID
export const useSection = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.section(id),
    queryFn: () => SectionsAPI.getById(id),
    select: response => response.data,
    enabled: !!id
  });
};

// Get section inventory
export const useSectionInventory = (sectionId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.sectionInventory(sectionId),
    queryFn: () => SectionsAPI.getSectionInventory(sectionId),
    select: response => response.data,
    enabled: !!sectionId,
    staleTime: 1 * 60 * 1000 // 1 minute
  });
};

// Get section consumption
export const useSectionConsumption = (
  sectionId: string,
  filters?: {
    rawMaterialId?: string;
    fromDate?: Date;
    toDate?: Date;
  }
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.sectionConsumption(sectionId), filters],
    queryFn: () => SectionsAPI.getSectionConsumption(sectionId, filters),
    select: response => response.data,
    enabled: !!sectionId,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
};

// Create section mutation
export const useCreateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSectionInput) => SectionsAPI.create(data),
    onSuccess: response => {
      if (response.success) {
        // Invalidate sections list
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sections] });
      }
    }
  });
};

// Update section mutation
export const useUpdateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSectionInput) => SectionsAPI.update(data),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Update specific item in cache
        queryClient.setQueryData(QUERY_KEYS.section(variables.id), { data: response.data });
        // Invalidate lists
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sections] });
      }
    }
  });
};

// Delete section mutation
export const useDeleteSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SectionsAPI.delete(id),
    onSuccess: response => {
      if (response.success) {
        // Invalidate sections queries
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sections] });
      }
    }
  });
};

// Assign stock to section mutation
export const useAssignStockToSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSectionAssignmentInput) => SectionsAPI.assignStock(data),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate section inventory
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.sectionInventory(variables.sectionId)
        });
        // Invalidate stock levels (they would have changed)
        queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
      }
    }
  });
};

// Record consumption mutation
export const useRecordConsumption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, rawMaterialId, quantity, consumedBy, reason, orderId, notes }: { sectionId: string; rawMaterialId: string; quantity: number; consumedBy: string; reason: string; orderId?: string; notes?: string }) => SectionsAPI.recordConsumption(sectionId, rawMaterialId, quantity, consumedBy, reason, orderId, notes),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate section inventory and consumption
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.sectionInventory(variables.sectionId)
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.sectionConsumption(variables.sectionId)
        });
        // Invalidate stock levels
        queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
      }
    }
  });
};

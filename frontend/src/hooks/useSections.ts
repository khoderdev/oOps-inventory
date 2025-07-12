import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SectionsAPI } from "../data/sections.api";
import { SectionType, type CreateSectionAssignmentInput, type CreateSectionInput, type CreateSectionRecipeAssignmentInput, type RecipeConsumptionFilters, type RecordRecipeConsumptionInput, type RemoveSectionRecipeAssignmentInput, type UpdateSectionInput } from "../types";

const QUERY_KEYS = {
  sections: "sections",
  section: (id: string) => ["section", id],
  sectionInventory: (sectionId: string) => ["sectionInventory", sectionId],
  sectionConsumption: (sectionId: string) => ["sectionConsumption", sectionId],
  sectionRecipes: (sectionId: string) => ["sectionRecipes", sectionId],
  recipeConsumption: (recipeId: string) => ["recipeConsumption", recipeId],
  sectionRecipesConsumption: (sectionId: string) => ["sectionRecipesConsumption", sectionId]
} as const;

// Get all sections
export const useSections = (filters?: { type?: SectionType; isActive?: boolean; managerId?: number }) => {
  return useQuery({
    queryKey: [QUERY_KEYS.sections, filters],
    queryFn: () =>
      SectionsAPI.getAll({
        ...filters,
        type: filters?.type,
        isActive: filters?.isActive,
        managerId: filters?.managerId
      }),
    select: response => response.data,
    staleTime: 5 * 60 * 1000
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
    staleTime: 1 * 60 * 1000
  });
};

// Get section recipes
export const useSectionRecipes = (sectionId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.sectionRecipes(sectionId)],
    queryFn: async () => {
      if (!sectionId) return [];
      const response = await SectionsAPI.getSectionRecipes(sectionId);
      return response.data;
    },
    enabled: !!sectionId
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
    queryFn: () =>
      SectionsAPI.getSectionConsumption(sectionId, {
        ...filters,
        fromDate: filters?.fromDate?.toISOString(),
        toDate: filters?.toDate?.toISOString()
      }),
    select: response => response.data,
    enabled: !!sectionId,
    staleTime: 2 * 60 * 1000
  });
};

// Add these new hooks
export const useRecordRecipeConsumption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordRecipeConsumptionInput) => SectionsAPI.recordRecipeConsumption(data),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.sectionInventory(variables.sectionId.toString())]
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.sectionConsumption(variables.sectionId.toString())]
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.recipeConsumption(variables.recipeId.toString())]
        });
        queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
      }
    }
  });
};

export const useRecipeConsumption = (recipeId: string, filters?: RecipeConsumptionFilters) => {
  return useQuery({
    queryKey: [QUERY_KEYS.recipeConsumption(recipeId), filters],
    queryFn: async () => {
      const response = await SectionsAPI.getRecipeConsumption(recipeId, {
        ...filters,
        fromDate: filters?.fromDate?.toISOString(),
        toDate: filters?.toDate?.toISOString()
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data.map(item => ({ ...item, date: new Date(item.date) }));
    },
    enabled: !!recipeId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1
  });
};

export const useSectionRecipesConsumption = (sectionId: string, filters?: RecipeConsumptionFilters) => {
  return useQuery({
    queryKey: [QUERY_KEYS.sectionRecipesConsumption(sectionId), filters],
    queryFn: async () => {
      try {
        const data = await SectionsAPI.getSectionRecipesConsumption(sectionId);
        return data.map(item => ({
          ...item,
          consumedDate: new Date(item.consumedDate),
          recipeName: item.recipe?.name || "Unknown Recipe"
        }));
      } catch (error) {
        console.error("Error in queryFn:", error);
        throw error;
      }
    },
    enabled: !!sectionId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1
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
        queryClient.invalidateQueries({ predicate: query => query.queryKey[0] === QUERY_KEYS.sections });
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
        queryClient.setQueryData(QUERY_KEYS.section(variables.id.toString()), { data: response.data });
        // Invalidate lists
        queryClient.invalidateQueries({ predicate: query => query.queryKey[0] === QUERY_KEYS.sections });
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
        queryClient.invalidateQueries({ predicate: query => query.queryKey[0] === QUERY_KEYS.sections });
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
          queryKey: QUERY_KEYS.sectionInventory(variables.sectionId.toString())
        });
        // Invalidate stock levels (they would have changed)
        queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
      }
    }
  });
};

// Assign recipe to section mutation
export const useAssignRecipeToSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSectionRecipeAssignmentInput) => SectionsAPI.assignRecipe(data),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate section inventory
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.sectionInventory(variables.sectionId.toString())
        });
        // Invalidate recipes (they might have changed)
        queryClient.invalidateQueries({ queryKey: ["recipes"] });
      }
    }
  });
};

// Remove recipe from section mutation
export const useRemoveRecipeFromSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RemoveSectionRecipeAssignmentInput) => SectionsAPI.removeRecipeAssignment(data),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate section inventory
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.sectionInventory(variables.assignmentId.toString())
        });
        // Invalidate recipes (they might have changed)
        queryClient.invalidateQueries({ queryKey: ["recipes"] });
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
          queryKey: QUERY_KEYS.sectionInventory(variables.sectionId.toString())
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.sectionConsumption(variables.sectionId.toString())
        });
        // Invalidate stock levels
        queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
      }
    }
  });
};

// Update section inventory mutation
export const useUpdateSectionInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inventoryId, quantity, updatedBy, notes }: { inventoryId: string; quantity: number; updatedBy: string; notes?: string }) => SectionsAPI.updateSectionInventory(inventoryId, quantity, updatedBy, notes),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate section inventory queries
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.sectionInventory(variables.inventoryId.toString())]
        });
        // Invalidate stock levels
        queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
        // Invalidate stock movements
        queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
      }
    }
  });
};

// Remove section inventory mutation
export const useRemoveSectionInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inventoryId, removedBy, notes }: { inventoryId: string; removedBy: string; notes?: string }) => SectionsAPI.removeSectionInventory(inventoryId, removedBy, notes),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate section inventory queries
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.sectionInventory(variables.inventoryId.toString())]
        });
        // Invalidate stock levels
        queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
        // Invalidate stock movements
        queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
      }
    }
  });
};

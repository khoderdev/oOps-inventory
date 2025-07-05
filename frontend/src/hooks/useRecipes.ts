import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recipesApi } from "../data/recipes.api";
import type { CreateMenuItemRequest, CreateRecipeRequest, RecipeFilters } from "../types";

export const useRecipes = (filters?: RecipeFilters) => {
  return useQuery({
    queryKey: ["recipes", filters],
    queryFn: () => recipesApi.getRecipes(filters),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // Refetch every minute
  });
};

export const useRecipe = (id: number) => {
  return useQuery({
    queryKey: ["recipe", id],
    queryFn: () => recipesApi.getRecipeById(id),
    enabled: !!id,
    staleTime: 30000
  });
};

export const useRecipeCost = (id: number) => {
  return useQuery({
    queryKey: ["recipe-cost", id],
    queryFn: () => recipesApi.calculateRecipeCost(id),
    enabled: !!id,
    staleTime: 60000 // 1 minute
  });
};

export const useRecipeCostVariance = (id: number, days?: number) => {
  return useQuery({
    queryKey: ["recipe-cost-variance", id, days],
    queryFn: () => recipesApi.getRecipeCostVariance(id, days),
    enabled: !!id,
    staleTime: 300000 // 5 minutes
  });
};

export const useMenuEngineering = (days?: number) => {
  return useQuery({
    queryKey: ["menu-engineering", days],
    queryFn: () => recipesApi.getMenuEngineering(days),
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000 // Refetch every 5 minutes
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecipeRequest) => recipesApi.createRecipe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["menu-engineering"] });
    }
  });
};

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateRecipeRequest> }) => recipesApi.updateRecipe(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipe", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["recipe-cost", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["menu-engineering"] });
    }
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => recipesApi.deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["menu-engineering"] });
    }
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMenuItemRequest) => recipesApi.createMenuItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-engineering"] });
    }
  });
};

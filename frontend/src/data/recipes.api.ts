import { apiClient, handleApiResponse } from "../lib/api";
import type { CreateMenuItemRequest, CreateRecipeRequest, MenuEngineering, MenuItem, PaginatedRecipes, Recipe, RecipeCostAnalysis, RecipeFilters } from "../types";

export const recipesApi = {
  // Get recipes with filtering
  getRecipes: async (filters?: RecipeFilters): Promise<PaginatedRecipes> => {
    const params = new URLSearchParams();

    if (filters?.category) params.append("category", filters.category);
    if (filters?.is_active !== undefined) params.append("is_active", filters.is_active.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get<PaginatedRecipes>(`/recipes?${params.toString()}`);
    return handleApiResponse(response);
  },

  // Get recipe by ID
  getRecipeById: async (id: number): Promise<Recipe> => {
    const response = await apiClient.get<Recipe>(`/recipes/${id}`);
    return handleApiResponse(response);
  },

  // Create new recipe
  createRecipe: async (data: CreateRecipeRequest): Promise<Recipe> => {
    const response = await apiClient.post<Recipe>("/recipes", data);
    return handleApiResponse(response);
  },

  // Update recipe
  updateRecipe: async (id: number, data: Partial<CreateRecipeRequest>): Promise<Recipe> => {
    const response = await apiClient.put<Recipe>(`/recipes/${id}`, data);
    return handleApiResponse(response);
  },

  // Delete recipe (soft delete)
  deleteRecipe: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/recipes/${id}`);
    return handleApiResponse(response);
  },

  // Calculate recipe cost
  calculateRecipeCost: async (id: number): Promise<RecipeCostAnalysis> => {
    const response = await apiClient.get<RecipeCostAnalysis>(`/recipes/${id}/calculate-cost`);
    return handleApiResponse(response);
  },

  // Get recipe cost variance analysis
  getRecipeCostVariance: async (id: number, days?: number): Promise<{ message: string }> => {
    const params = days ? `?days=${days}` : "";
    const response = await apiClient.get<{ message: string }>(`/recipes/${id}/cost-variance${params}`);
    return handleApiResponse(response);
  },

  // Create menu item
  createMenuItem: async (data: CreateMenuItemRequest): Promise<MenuItem> => {
    const response = await apiClient.post<MenuItem>("/recipes/menu-items", data);
    return handleApiResponse(response);
  },

  // Get menu engineering analysis
  getMenuEngineering: async (days?: number): Promise<MenuEngineering> => {
    const params = days ? `?days=${days}` : "";
    const response = await apiClient.get<MenuEngineering>(`/recipes/menu-engineering${params}`);
    return handleApiResponse(response);
  }
};

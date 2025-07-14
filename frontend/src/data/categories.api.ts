import { apiClient, handleApiResponse } from "../lib/api";
import type { CategoryResponse } from "../types";

export const categoriesApi = {
  getCategories: async () => {
    const response = await apiClient.get("/categories");
    return handleApiResponse(response);
  },

  getCategoryById: async (id: number) => {
    const response = await apiClient.get(`/categories/${id}`);
    return handleApiResponse(response);
  },

  createCategory: async (data: CategoryResponse) => {
    const response = await apiClient.post("/categories", data);
    return handleApiResponse(response);
  },

  updateCategory: async (id: number, data: CategoryResponse) => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return handleApiResponse(response);
  },

  deleteCategory: async (id: number) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return handleApiResponse(response);
  }
};

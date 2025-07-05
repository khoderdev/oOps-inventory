import { apiClient, handleApiResponse } from "../lib/api";
import type { Budget, BudgetAnalytics, BudgetFilters, BudgetRecommendations, BudgetSpendingAnalysis, BudgetVarianceAnalysis, CreateBudgetRequest, PaginatedBudgets } from "../types";

export const budgetsApi = {
  // Get budgets with filtering
  getBudgets: async (filters?: BudgetFilters): Promise<PaginatedBudgets> => {
    const params = new URLSearchParams();

    if (filters?.period_type) params.append("period_type", filters.period_type);
    if (filters?.is_active !== undefined) params.append("is_active", filters.is_active.toString());
    if (filters?.year) params.append("year", filters.year.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get<PaginatedBudgets>(`/budgets?${params.toString()}`);
    return handleApiResponse(response);
  },

  // Get budget by ID
  getBudgetById: async (id: number): Promise<Budget> => {
    const response = await apiClient.get<Budget>(`/budgets/${id}`);
    return handleApiResponse(response);
  },

  // Create new budget
  createBudget: async (data: CreateBudgetRequest): Promise<Budget> => {
    const response = await apiClient.post<Budget>("/budgets", data);
    return handleApiResponse(response);
  },

  // Update budget
  updateBudget: async (id: number, data: Partial<CreateBudgetRequest>): Promise<Budget> => {
    const response = await apiClient.put<Budget>(`/budgets/${id}`, data);
    return handleApiResponse(response);
  },

  // Delete budget (soft delete)
  deleteBudget: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/budgets/${id}`);
    return handleApiResponse(response);
  },

  // Calculate budget spending
  calculateBudgetSpending: async (id: number): Promise<BudgetSpendingAnalysis> => {
    const response = await apiClient.get<BudgetSpendingAnalysis>(`/budgets/${id}/spending`);
    return handleApiResponse(response);
  },

  // Get budget variance analysis
  getBudgetVarianceAnalysis: async (id: number): Promise<BudgetVarianceAnalysis> => {
    const response = await apiClient.get<BudgetVarianceAnalysis>(`/budgets/${id}/variance`);
    return handleApiResponse(response);
  },

  // Generate budget recommendations
  generateBudgetRecommendations: async (id: number): Promise<BudgetRecommendations> => {
    const response = await apiClient.get<BudgetRecommendations>(`/budgets/${id}/recommendations`);
    return handleApiResponse(response);
  },

  // Get budget analytics
  getAnalytics: async (): Promise<BudgetAnalytics> => {
    const response = await apiClient.get<BudgetAnalytics>("/budgets/analytics");
    return handleApiResponse(response);
  }
};

import { apiClient, handleApiResponse } from "../lib/api";
import type { CostAnalyticsData, CostControlDashboardData, CostTrendData, OptimizationRecommendationsData, SupplierAnalysisResponse } from "../types/costControl.types";

export const costControlApi = {
  // Get complete dashboard data
  getDashboard: async (days: number = 30): Promise<CostControlDashboardData> => {
    const response = await apiClient.get<CostControlDashboardData>(`/cost-control/dashboard?days=${days}`);
    return handleApiResponse(response);
  },

  // Get detailed cost analytics
  getAnalytics: async (days: number = 30, category?: string): Promise<CostAnalyticsData> => {
    const params = new URLSearchParams({ days: days.toString() });
    if (category) params.append("category", category);

    const response = await apiClient.get<CostAnalyticsData>(`/cost-control/analytics?${params.toString()}`);
    return handleApiResponse(response);
  },

  // Get supplier analysis with scorecards
  getSupplierAnalysis: async (days: number = 30): Promise<SupplierAnalysisResponse> => {
    const response = await apiClient.get<SupplierAnalysisResponse>(`/cost-control/suppliers?days=${days}`);
    return handleApiResponse(response);
  },

  // Get cost optimization recommendations
  getRecommendations: async (): Promise<OptimizationRecommendationsData> => {
    const response = await apiClient.get<OptimizationRecommendationsData>("/cost-control/recommendations");
    return handleApiResponse(response);
  },

  // Get cost trend analysis
  getTrends: async (days: number = 90): Promise<CostTrendData> => {
    const response = await apiClient.get<CostTrendData>(`/cost-control/trends?days=${days}`);
    return handleApiResponse(response);
  }
};

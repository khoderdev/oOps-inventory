import { useQuery } from "@tanstack/react-query";
import { costControlApi } from "../data/costControl.api";

// Query keys for React Query
export const COST_CONTROL_QUERY_KEYS = {
  dashboard: (days: number) => ["cost-control", "dashboard", days] as const,
  analytics: (days: number, category?: string) => ["cost-control", "analytics", days, category] as const,
  suppliers: (days: number) => ["cost-control", "suppliers", days] as const,
  recommendations: () => ["cost-control", "recommendations"] as const,
  trends: (days: number) => ["cost-control", "trends", days] as const
};

// Enhanced Cost Control Dashboard Hook
export const useCostControlDashboard = (days: number = 30) => {
  return useQuery({
    queryKey: COST_CONTROL_QUERY_KEYS.dashboard(days),
    queryFn: () => costControlApi.getDashboard(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

// Detailed Cost Analytics Hook
export const useCostAnalytics = (days: number = 30, category?: string) => {
  return useQuery({
    queryKey: COST_CONTROL_QUERY_KEYS.analytics(days, category),
    queryFn: () => costControlApi.getAnalytics(days, category),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2
  });
};

// Supplier Analysis with Scorecards Hook
export const useSupplierAnalysis = (days: number = 30) => {
  return useQuery({
    queryKey: COST_CONTROL_QUERY_KEYS.suppliers(days),
    queryFn: () => costControlApi.getSupplierAnalysis(days),
    staleTime: 10 * 60 * 1000, // 10 minutes - supplier data changes less frequently
    gcTime: 15 * 60 * 1000,
    retry: 2
  });
};

// Cost Optimization Recommendations Hook
export const useCostOptimizationRecommendations = () => {
  return useQuery({
    queryKey: COST_CONTROL_QUERY_KEYS.recommendations(),
    queryFn: () => costControlApi.getRecommendations(),
    staleTime: 15 * 60 * 1000, // 15 minutes - recommendations change less frequently
    gcTime: 30 * 60 * 1000,
    retry: 2
  });
};

// Cost Trend Analysis Hook
export const useCostTrends = (days: number = 90) => {
  return useQuery({
    queryKey: COST_CONTROL_QUERY_KEYS.trends(days),
    queryFn: () => costControlApi.getTrends(days),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    retry: 2
  });
};

// Combined hook for the main cost control dashboard
export const useCostControl = (days: number = 30) => {
  const dashboard = useCostControlDashboard(days);
  const analytics = useCostAnalytics(days);
  const suppliers = useSupplierAnalysis(days);
  const recommendations = useCostOptimizationRecommendations();
  const trends = useCostTrends(90); // Default to 90 days for trends

  return {
    // Dashboard data
    dashboard: {
      data: dashboard.data,
      isLoading: dashboard.isLoading,
      error: dashboard.error,
      refetch: dashboard.refetch
    },

    // Analytics data
    analytics: {
      data: analytics.data,
      isLoading: analytics.isLoading,
      error: analytics.error,
      refetch: analytics.refetch
    },

    // Supplier analysis
    suppliers: {
      data: suppliers.data,
      isLoading: suppliers.isLoading,
      error: suppliers.error,
      refetch: suppliers.refetch
    },

    // Recommendations
    recommendations: {
      data: recommendations.data,
      isLoading: recommendations.isLoading,
      error: recommendations.error,
      refetch: recommendations.refetch
    },

    // Trends
    trends: {
      data: trends.data,
      isLoading: trends.isLoading,
      error: trends.error,
      refetch: trends.refetch
    },

    // Combined states
    isLoading: dashboard.isLoading || analytics.isLoading || suppliers.isLoading || recommendations.isLoading || trends.isLoading,
    isError: dashboard.error || analytics.error || suppliers.error || recommendations.error || trends.error,

    // Refetch all data
    refetchAll: () => {
      dashboard.refetch();
      analytics.refetch();
      suppliers.refetch();
      recommendations.refetch();
      trends.refetch();
    }
  };
};

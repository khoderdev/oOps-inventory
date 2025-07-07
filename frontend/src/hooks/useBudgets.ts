import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetsApi } from "../data/budgets.api";
import type { BudgetFilters, CreateBudgetRequest } from "../types";

export const useBudgets = (filters?: BudgetFilters) => {
  return useQuery({
    queryKey: ["budgets", filters],
    queryFn: () => budgetsApi.getBudgets(filters),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // Refetch every minute
  });
};

export const useBudget = (id: number) => {
  return useQuery({
    queryKey: ["budget", id],
    queryFn: () => budgetsApi.getBudgetById(id),
    enabled: !!id,
    staleTime: 30000
  });
};

export const useBudgetSpending = (id: number) => {
  return useQuery({
    queryKey: ["budget-spending", id],
    queryFn: () => budgetsApi.calculateBudgetSpending(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000 // Refetch every 5 minutes
  });
};

export const useBudgetVariance = (id: number) => {
  return useQuery({
    queryKey: ["budget-variance", id],
    queryFn: () => budgetsApi.getBudgetVarianceAnalysis(id),
    enabled: !!id,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000 // Refetch every 5 minutes
  });
};

export const useBudgetRecommendations = (id: number) => {
  return useQuery({
    queryKey: ["budget-recommendations", id],
    queryFn: () => budgetsApi.generateBudgetRecommendations(id),
    enabled: !!id,
    staleTime: 600000 // 10 minutes
  });
};

export const useBudgetAnalytics = () => {
  return useQuery({
    queryKey: ["budget-analytics"],
    queryFn: () => budgetsApi.getAnalytics(),
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000 // Refetch every 5 minutes
  });
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBudgetRequest) => budgetsApi.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget-analytics"] });
    }
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateBudgetRequest> }) => budgetsApi.updateBudget(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["budget-spending", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["budget-variance", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["budget-analytics"] });
    }
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => budgetsApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget-analytics"] });
    }
  });
};

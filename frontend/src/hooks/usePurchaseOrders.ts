import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { purchaseOrdersApi } from "../data/purchaseOrders.api";
import type { CreatePurchaseOrderRequest, PurchaseOrderFilters, ReceiveGoodsRequest } from "../types";

export const usePurchaseOrders = (filters?: PurchaseOrderFilters) => {
  return useQuery({
    queryKey: ["purchase-orders", filters],
    queryFn: () => purchaseOrdersApi.getPurchaseOrders(filters),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // Refetch every minute
  });
};

export const usePurchaseOrder = (id: number) => {
  return useQuery({
    queryKey: ["purchase-order", id],
    queryFn: () => purchaseOrdersApi.getPurchaseOrderById(id),
    enabled: !!id,
    staleTime: 30000
  });
};

export const usePurchaseOrderAnalytics = (days?: number) => {
  return useQuery({
    queryKey: ["purchase-order-analytics", days],
    queryFn: () => purchaseOrdersApi.getAnalytics(days),
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000 // Refetch every 5 minutes
  });
};

export const useReorderSuggestions = () => {
  return useQuery({
    queryKey: ["reorder-suggestions"],
    queryFn: () => purchaseOrdersApi.getReorderSuggestions(),
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000 // Refetch every 5 minutes
  });
};

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseOrderRequest) => purchaseOrdersApi.createPurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["reorder-suggestions"] });
    }
  });
};

export const useApprovePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => purchaseOrdersApi.approvePurchaseOrder(id),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", data.id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-analytics"] });
    }
  });
};

export const useSendPurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => purchaseOrdersApi.sendPurchaseOrder(id),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", data.id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-analytics"] });
    }
  });
};

export const useReceiveGoods = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReceiveGoodsRequest }) => purchaseOrdersApi.receiveGoods(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
    }
  });
};

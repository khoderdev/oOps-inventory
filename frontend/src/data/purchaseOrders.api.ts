import { apiClient, handleApiResponse } from "../lib/api";
import type { CreatePurchaseOrderRequest, PaginatedPurchaseOrders, PurchaseOrder, PurchaseOrderAnalytics, PurchaseOrderFilters, ReceiveGoodsRequest, ReorderSuggestionsResponse } from "../types";

export const purchaseOrdersApi = {
  // Get purchase orders with filtering
  getPurchaseOrders: async (filters?: PurchaseOrderFilters): Promise<PaginatedPurchaseOrders> => {
    const params = new URLSearchParams();

    if (filters?.status) params.append("status", filters.status);
    if (filters?.supplier_id) params.append("supplier_id", filters.supplier_id.toString());
    if (filters?.date_from) params.append("date_from", filters.date_from);
    if (filters?.date_to) params.append("date_to", filters.date_to);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get<PaginatedPurchaseOrders>(`/purchase-orders?${params.toString()}`);
    return handleApiResponse(response);
  },

  // Get purchase order by ID
  getPurchaseOrderById: async (id: number): Promise<PurchaseOrder> => {
    const response = await apiClient.get<PurchaseOrder>(`/purchase-orders/${id}`);
    return handleApiResponse(response);
  },

  // Create new purchase order
  createPurchaseOrder: async (data: CreatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>("/purchase-orders", data);
    return handleApiResponse(response);
  },

  // Approve purchase order
  approvePurchaseOrder: async (id: number): Promise<PurchaseOrder> => {
    const response = await apiClient.put<PurchaseOrder>(`/purchase-orders/${id}/approve`);
    return handleApiResponse(response);
  },

  // Send purchase order to supplier
  sendPurchaseOrder: async (id: number): Promise<PurchaseOrder> => {
    const response = await apiClient.put<PurchaseOrder>(`/purchase-orders/${id}/send`);
    return handleApiResponse(response);
  },

  // Receive goods against purchase order
  receiveGoods: async (id: number, data: ReceiveGoodsRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/purchase-orders/${id}/receive`, data);
    return handleApiResponse(response);
  },

  // Get purchase order analytics
  getAnalytics: async (days?: number): Promise<PurchaseOrderAnalytics> => {
    const params = days ? `?days=${days}` : "";
    const response = await apiClient.get<PurchaseOrderAnalytics>(`/purchase-orders/analytics${params}`);
    return handleApiResponse(response);
  },

  // Get reorder suggestions
  getReorderSuggestions: async (): Promise<ReorderSuggestionsResponse> => {
    const response = await apiClient.get<ReorderSuggestionsResponse>("/purchase-orders/reorder-suggestions");
    return handleApiResponse(response);
  }
};

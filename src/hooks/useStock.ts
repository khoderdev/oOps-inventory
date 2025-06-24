import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StockAPI } from "../data/stock.api";
import type { CreateStockEntryInput, CreateStockMovementInput, MovementType } from "../types";

const QUERY_KEYS = {
  stockEntries: "stockEntries",
  stockMovements: "stockMovements",
  stockLevels: "stockLevels",
  stockLevel: (rawMaterialId: string) => ["stockLevel", rawMaterialId]
} as const;

// Get all stock entries
export const useStockEntries = (filters?: { rawMaterialId?: string; supplier?: string; fromDate?: Date; toDate?: Date }) => {
  return useQuery({
    queryKey: [QUERY_KEYS.stockEntries, filters],
    queryFn: () => StockAPI.getAllEntries(filters),
    select: response => response.data,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get stock movements
export const useStockMovements = (filters?: { stockEntryId?: string; type?: MovementType; fromDate?: Date; toDate?: Date; sectionId?: string }) => {
  return useQuery({
    queryKey: [QUERY_KEYS.stockMovements, filters],
    queryFn: () => StockAPI.getMovements(filters),
    select: response => response.data,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
};

// Get current stock levels
export const useStockLevels = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.stockLevels],
    queryFn: () => StockAPI.getCurrentStockLevels(),
    select: response => response.data,
    staleTime: 1 * 60 * 1000 // 1 minute
  });
};

// Get stock level for specific material
export const useStockLevel = (rawMaterialId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.stockLevel(rawMaterialId),
    queryFn: () => StockAPI.getStockLevel(rawMaterialId),
    select: response => response.data,
    enabled: !!rawMaterialId,
    staleTime: 1 * 60 * 1000 // 1 minute
  });
};

// Create stock entry mutation
export const useCreateStockEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStockEntryInput) => StockAPI.createEntry(data),
    onSuccess: response => {
      if (response.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stockEntries] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stockLevels] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stockMovements] });

        // Invalidate specific stock level
        if (response.data.rawMaterialId) {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.stockLevel(response.data.rawMaterialId)
          });
        }
      }
    }
  });
};

// Create stock movement mutation
export const useCreateStockMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStockMovementInput) => StockAPI.createMovement(data),
    onSuccess: response => {
      if (response.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stockMovements] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stockLevels] });
      }
    }
  });
};

// Transfer stock mutation
export const useTransferStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stockEntryId, fromSectionId, toSectionId, quantity, performedBy, reason }: { stockEntryId: string; fromSectionId: string; toSectionId: string; quantity: number; performedBy: string; reason: string }) => StockAPI.transferStock(stockEntryId, fromSectionId, toSectionId, quantity, performedBy, reason),
    onSuccess: response => {
      if (response.success) {
        // Invalidate all stock-related queries
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stockMovements] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stockLevels] });
      }
    }
  });
};

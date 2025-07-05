export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  tax_id?: string;
  payment_terms: number;
  discount_rate?: number;
  credit_limit?: number;
  is_active: boolean;
  rating?: number;
  lead_time_days: number;
  minimum_order?: number;
  created_at: string;
  updated_at: string;
  supplier_materials?: SupplierMaterial[];
  purchase_orders?: PurchaseOrderSummary[];
  _count?: {
    purchase_orders: number;
    supplier_materials: number;
  };
}

export interface SupplierMaterial {
  id: number;
  supplier_id: number;
  raw_material_id: number;
  supplier_sku?: string;
  unit_cost: number;
  minimum_quantity: number;
  lead_time_days: number;
  is_preferred: boolean;
  last_price_update?: string;
  created_at: string;
  updated_at: string;
  raw_material?: {
    id: number;
    name: string;
    unit: string;
    category: string;
  };
}

export interface PurchaseOrderSummary {
  id: number;
  total_amount: number;
  status: string;
  order_date: string;
}

export interface SupplierPerformance {
  supplierId: number;
  supplierName: string;
  period: string;
  metrics: {
    totalOrders: number;
    totalValue: number;
    averageOrderValue: number;
    onTimeDeliveryRate: number;
    orderAccuracyRate: number;
    qualityScore: number;
    paymentTermsCompliance: number;
    responseTime: number;
  };
  recentOrders: RecentOrder[];
}

export interface RecentOrder {
  id: number;
  poNumber: string;
  orderDate: string;
  expectedDate: string;
  receivedDate?: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  isOnTime?: boolean;
}

export interface SupplierComparison {
  material: {
    id: number;
    name: string;
    category: string;
    unit: string;
    currentUnitCost: number;
  };
  suppliers: SupplierComparisonItem[];
  analysis?: {
    lowestPrice: number;
    highestPrice: number;
    averagePrice: number;
    bestValueSupplier: SupplierComparisonItem;
    potentialSavings: number;
  };
}

export interface SupplierComparisonItem {
  supplierId: number;
  supplierName: string;
  unitCost: number;
  minimumQuantity: number;
  leadTimeDays: number;
  isPreferred: boolean;
  lastPriceUpdate?: string;
  supplierRating: number;
  paymentTerms: number;
  savingsVsCurrent: number;
  savingsPercentage: number;
}

export interface SupplierAnalytics {
  summary: {
    totalSuppliers: number;
    activeSuppliers: number;
    inactiveSuppliers: number;
    totalSpent: number;
    averageRating: number;
    averageLeadTime: number;
    highPerformers: number;
  };
  topSuppliers: TopSupplier[];
}

export interface TopSupplier {
  id: number;
  name: string;
  rating: number;
  orderCount: number;
  totalValue: number;
  avgOrderValue: number;
}

export interface CreateSupplierRequest {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  tax_id?: string;
  payment_terms?: number;
  discount_rate?: number;
  credit_limit?: number;
  rating?: number;
  lead_time_days?: number;
  minimum_order?: number;
}

export interface UpdateSupplierMaterialRequest {
  supplier_id: number;
  raw_material_id: number;
  supplier_sku?: string;
  unit_cost: number;
  minimum_quantity: number;
  lead_time_days?: number;
  is_preferred?: boolean;
}

export interface SupplierFilters {
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSuppliers {
  suppliers: Supplier[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const SupplierGrades = {
  A: { label: "Excellent", color: "bg-green-100 text-green-800", range: "9-10" },
  B: { label: "Good", color: "bg-blue-100 text-blue-800", range: "7-8" },
  C: { label: "Average", color: "bg-yellow-100 text-yellow-800", range: "5-6" },
  D: { label: "Poor", color: "bg-red-100 text-red-800", range: "1-4" }
};

export const getSupplierGrade = (rating: number): keyof typeof SupplierGrades => {
  if (rating >= 9) return "A";
  if (rating >= 7) return "B";
  if (rating >= 5) return "C";
  return "D";
};

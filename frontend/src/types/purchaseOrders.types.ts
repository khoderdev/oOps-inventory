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
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier?: Supplier;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_date: string;
  received_date?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  approved_by?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  order_items: PurchaseOrderItem[];
  creator?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  approver?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  raw_material_id: number;
  raw_material?: {
    id: number;
    name: string;
    unit: string;
    category: string;
  };
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  line_total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseReceipt {
  id: number;
  purchase_order_id: number;
  receipt_number: string;
  received_date: string;
  received_by: number;
  notes?: string;
  is_partial: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePurchaseOrderRequest {
  supplier_id: number;
  order_date: string;
  expected_date: string;
  discount_amount?: number;
  notes?: string;
  items: CreatePurchaseOrderItem[];
}

export interface CreatePurchaseOrderItem {
  raw_material_id: number;
  quantity_ordered: number;
  unit_cost: number;
  notes?: string;
}

export interface ReceiveGoodsRequest {
  received_date: string;
  notes?: string;
  is_partial: boolean;
  supplier_name: string;
  po_number: string;
  received_items: ReceiveGoodsItem[];
}

export interface ReceiveGoodsItem {
  id: number;
  raw_material_id: number;
  quantity_received: number;
  unit_cost: number;
}

export interface PurchaseOrderAnalytics {
  summary: {
    totalOrders: number;
    totalValue: number;
    pendingOrders: number;
    overdueOrders: number;
    averageOrderValue: number;
  };
  topSuppliers: SupplierAnalytic[];
  categorySpending: CategorySpending[];
}

export interface SupplierAnalytic {
  supplier_id: number;
  name: string;
  orderCount: number;
  totalValue: number;
  avgOrderValue: number;
}

export interface CategorySpending {
  category: string;
  totalSpending: number;
  itemCount: number;
}

export interface ReorderSuggestion {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  suggestedQuantity: number;
  averageDailyConsumption: number;
  daysOfStock: number;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  unitCost: number;
}

export interface ReorderSuggestionsResponse {
  reorderSuggestions: ReorderSuggestion[];
  summary: {
    totalItems: number;
    highUrgency: number;
    estimatedValue: number;
  };
}

export interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus;
  supplier_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPurchaseOrders {
  orders: PurchaseOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export enum PurchaseOrderStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  SENT = "SENT",
  PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export const PurchaseOrderStatusLabels: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.DRAFT]: "Draft",
  [PurchaseOrderStatus.PENDING_APPROVAL]: "Pending Approval",
  [PurchaseOrderStatus.APPROVED]: "Approved",
  [PurchaseOrderStatus.SENT]: "Sent",
  [PurchaseOrderStatus.PARTIALLY_RECEIVED]: "Partially Received",
  [PurchaseOrderStatus.COMPLETED]: "Completed",
  [PurchaseOrderStatus.CANCELLED]: "Cancelled"
};

export const PurchaseOrderStatusColors: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.DRAFT]: "bg-gray-100 text-gray-800",
  [PurchaseOrderStatus.PENDING_APPROVAL]: "bg-yellow-100 text-yellow-800",
  [PurchaseOrderStatus.APPROVED]: "bg-blue-100 text-blue-800",
  [PurchaseOrderStatus.SENT]: "bg-purple-100 text-purple-800",
  [PurchaseOrderStatus.PARTIALLY_RECEIVED]: "bg-orange-100 text-orange-800",
  [PurchaseOrderStatus.COMPLETED]: "bg-green-100 text-green-800",
  [PurchaseOrderStatus.CANCELLED]: "bg-red-100 text-red-800"
};

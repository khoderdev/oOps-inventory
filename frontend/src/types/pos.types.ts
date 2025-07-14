// export interface SaleItemInput {
//   productId: string;
//   quantity: number;
//   price: number;
//   total: number;
// }

// export interface CreatePosSaleInput {
//   items: SaleItemInput[];
//   cashierId: string;
//   total: number;
//   discount?: number;
//   tax?: number;
//   finalTotal: number;
//   paymentMethod: "CASH" | "CARD" | "OTHER";
//   status?: "PENDING" | "COMPLETED" | "CANCELLED";
// }

// export interface PosSale {
//   id: string;
//   invoiceNumber: string;
//   cashierId: string;
//   total: number;
//   discount: number;
//   tax: number;
//   finalTotal: number;
//   paymentMethod: string;
//   status: string;
//   createdAt: string;
//   updatedAt: string;
//   items: SaleItemInput[];
// }
export interface SaleItem {
  id: string;
  type: "ITEM" | "RECIPE";
  name: string;
  price: number;
  quantity: number;
  cost: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePosSaleInput {
  sectionId: number;
  cashierId: number;
  items: Array<{
    id: string;
    type: "item" | "recipe";
    name: string;
    price: number;
    quantity: number;
    cost?: number; // Optional, will be calculated if not provided
  }>;
  subtotal: number;
  total: number;
  tax?: number;
  discount?: number;
  paymentMethod: "CASH" | "CARD";
  status?: "PENDING" | "COMPLETED" | "CANCELLED";
  saleDate?: Date | string;
}

export interface PosSale {
  id: string;
  invoiceNumber?: string;
  sectionId: number;
  cashierId: number;
  subtotal: number;
  total: number;
  tax: number;
  discount: number;
  finalTotal: number;
  paymentMethod: "CASH" | "CARD";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  saleDate: string;
  createdAt: string;
  updatedAt: string;
  items: SaleItem[];
  cashier?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  section?: {
    id: number;
    name: string;
    restaurantId?: number;
  };
}

// Additional supporting types
export interface PosSaleSummary {
  id: string;
  invoiceNumber?: string;
  total: number;
  paymentMethod: string;
  status: string;
  saleDate: string;
  cashierName: string;
  sectionName: string;
}

export interface PosSaleFilter {
  startDate?: Date | string;
  endDate?: Date | string;
  sectionId?: number;
  cashierId?: number;
  status?: "PENDING" | "COMPLETED" | "CANCELLED";
  paymentMethod?: "CASH" | "CARD";
}

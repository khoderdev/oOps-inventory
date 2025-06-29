export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  role: "manager" | "staff";
  email?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type SortOrder = "asc" | "desc";

export interface SortConfig {
  field: string;
  order: SortOrder;
}

export interface FilterConfig {
  [key: string]: string | number | boolean | Date;
}

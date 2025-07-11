export interface BaseEntity {
  id: number;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  STAFF = "STAFF"
}

export interface User {
  id: string;
  username: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  map(arg0: (item: any) => any): any;
  data: T;
  success: boolean;
  message?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequestData = any;

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

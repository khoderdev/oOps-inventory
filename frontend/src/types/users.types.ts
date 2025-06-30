import type { User } from "./common.types";

// Backend user data structure (snake_case)
export interface BackendUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Backend response structure
export interface BackendUsersResponse {
  users: BackendUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Users API filters interfaces
export interface UserFilters {
  role?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserFormProps {
  initialData?: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  STAFF = "STAFF"
}

export interface UserSubmitData {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
}

// Types for user operations
export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  password: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
}

export interface UsersQueryOptions extends UserFilters {
  enabled?: boolean;
}

export interface UserTableData extends Record<string, unknown> {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
}

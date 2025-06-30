import type { User, UserRole } from "./common.types";

// Backend user data structure (snake_case)
export interface BackendUser {
  id: string;
  username: string;
  email?: string;
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

export interface UserSubmitData {
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
}

// Types for user operations
export interface CreateUserData {
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: UserRole;
  password: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
}

export interface UsersQueryOptions extends UserFilters {
  enabled?: boolean;
}

export interface UserTableData extends Record<string, unknown> {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
}

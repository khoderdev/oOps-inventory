import { apiClient } from "../lib/api";
import type { ApiResponse, User } from "../types";

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

export class UsersAPI {
  /**
   * Get all users with optional filtering and pagination
   * GET /api/users
   */
  static async getAll(filters?: UserFilters): Promise<ApiResponse<UsersResponse>> {
    try {
      let endpoint = "/users";
      const params = new URLSearchParams();

      if (filters?.role) {
        params.append("role", filters.role);
      }

      if (filters?.isActive !== undefined) {
        params.append("isActive", filters.isActive.toString());
      }

      if (filters?.search) {
        params.append("search", filters.search);
      }

      if (filters?.page) {
        params.append("page", filters.page.toString());
      }

      if (filters?.limit) {
        params.append("limit", filters.limit.toString());
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      return await apiClient.get<UsersResponse>(endpoint);
    } catch (error) {
      return {
        data: { users: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } },
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch users"
      };
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  static async getById(id: string): Promise<ApiResponse<User | null>> {
    try {
      const response = await apiClient.get<{ user: User }>(`/users/${id}`);

      return {
        data: response.success && response.data ? response.data.user : null,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch user"
      };
    }
  }

  /**
   * Get all active users (simplified for dropdowns)
   * GET /api/users?isActive=true&limit=100
   */
  static async getActiveUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response = await this.getAll({ isActive: true, limit: 100 });

      return {
        data: response.data.users,
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch active users"
      };
    }
  }
}

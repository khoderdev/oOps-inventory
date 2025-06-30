import { apiClient } from "../lib/api";
import type { ApiResponse, User } from "../types";
import type { BackendUser, BackendUsersResponse, UserFilters, UserRole, UsersResponse } from "../types/users.types";

// Transform backend user data to frontend format
const transformUser = (backendUser: BackendUser): User => ({
  id: backendUser.id,
  email: backendUser.email,
  firstName: backendUser.first_name,
  lastName: backendUser.last_name,
  role: backendUser.role,
  isActive: backendUser.is_active,
  createdAt: backendUser.created_at ? new Date(backendUser.created_at) : undefined,
  updatedAt: backendUser.updated_at ? new Date(backendUser.updated_at) : undefined
});

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

      const backendResponse = await apiClient.get<BackendUsersResponse>(endpoint);

      // Transform backend data to frontend format
      const transformedData: UsersResponse = {
        users: backendResponse.data.users.map(transformUser),
        pagination: backendResponse.data.pagination
      };

      return {
        data: transformedData,
        success: backendResponse.success,
        message: backendResponse.message
      };
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
      const response = await apiClient.get<{ user: BackendUser }>(`/users/${id}`);

      return {
        data: response.success && response.data ? transformUser(response.data.user) : null,
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

  /**
   * Create a new user
   * POST /api/auth/register
   */
  static async create(userData: { firstName: string; lastName: string; email: string; role: "ADMIN" | "MANAGER" | "STAFF"; password: string; isActive?: boolean }): Promise<ApiResponse<User>> {
    try {
      // Transform frontend data to backend format (auth/register expects camelCase)
      const backendData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        password: userData.password,
        isActive: userData.isActive ?? true
      };

      const response = await apiClient.post<{ user: BackendUser }>("/auth/register", backendData);

      return {
        data: response.success && response.data ? transformUser(response.data.user) : ({} as User),
        success: response.success,
        message: response.message || "User created successfully"
      };
    } catch (error) {
      return {
        data: {} as User,
        success: false,
        message: error instanceof Error ? error.message : "Failed to create user"
      };
    }
  }

  /**
   * Update an existing user
   * PUT /api/users/:id
   */
  static async update(
    id: string,
    userData: {
      firstName: string;
      lastName: string;
      email: string;
      role: UserRole;
      isActive: boolean;
      password?: string;
    }
  ): Promise<ApiResponse<User>> {
    try {
      // Transform frontend data to backend format
      const backendData: Record<string, string | boolean> = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        role: userData.role,
        is_active: userData.isActive
      };

      // Only include password if provided
      if (userData.password && userData.password.trim()) {
        backendData.password = userData.password;
      }

      const response = await apiClient.put<{ user: BackendUser }>(`/users/${id}`, backendData);

      return {
        data: response.success && response.data ? transformUser(response.data.user) : ({} as User),
        success: response.success,
        message: response.message || "User updated successfully"
      };
    } catch (error) {
      return {
        data: {} as User,
        success: false,
        message: error instanceof Error ? error.message : "Failed to update user"
      };
    }
  }

  /**
   * Delete a user
   * DELETE /api/users/:id
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiClient.delete(`/users/${id}`);

      return {
        data: response.success,
        success: response.success,
        message: response.message || "User deleted successfully"
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete user"
      };
    }
  }

  /**
   * Toggle user status (activate/deactivate)
   * PUT /api/users/:id/status
   */
  static async toggleStatus(id: string, isActive: boolean): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.put<{ user: BackendUser }>(`/users/${id}/status`, {
        isActive: Boolean(isActive)
      });

      return {
        data: response.success && response.data ? transformUser(response.data.user) : ({} as User),
        success: response.success,
        message: response.message || `User ${isActive ? "activated" : "deactivated"} successfully`
      };
    } catch (error) {
      return {
        data: {} as User,
        success: false,
        message: error instanceof Error ? error.message : "Failed to update user status"
      };
    }
  }
}

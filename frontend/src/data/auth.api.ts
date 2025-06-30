import { apiClient, TokenManager } from "../lib/api";
import type { ApiResponse, User } from "../types";

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: "MANAGER" | "STAFF";
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  message: string;
}

export class AuthAPI {
  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/login", credentials);

      // The backend returns the response directly with success, user, token, message
      // Cast to AuthResponse since we know the backend structure
      const authResponse = response as unknown as AuthResponse;

      if (authResponse.success && authResponse.token) {
        // Store the token
        TokenManager.setToken(authResponse.token);
      }

      return authResponse;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Login failed",
        token: "",
        user: {} as User
      };
    }
  }

  /**
   * Register a new user
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/register", userData);

      // The backend returns the response directly with success, user, token, message
      // Cast to AuthResponse since we know the backend structure
      const authResponse = response as unknown as AuthResponse;

      if (authResponse.success && authResponse.token) {
        // Store the token
        TokenManager.setToken(authResponse.token);
      }

      return authResponse;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Registration failed",
        token: "",
        user: {} as User
      };
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<{ message: string }>("/auth/logout");

      // Always remove token from storage, even if backend call fails
      TokenManager.removeToken();

      return response;
    } catch {
      // Still remove token even if logout fails
      TokenManager.removeToken();

      return {
        data: { message: "Logged out" },
        success: true,
        message: "Logged out successfully"
      };
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<ApiResponse<{ user: User }>> {
    try {
      return await apiClient.get<{ user: User }>("/auth/me");
    } catch (error) {
      return {
        data: { user: {} as User },
        success: false,
        message: error instanceof Error ? error.message : "Failed to get profile"
      };
    }
  }

  /**
   * Verify token validity
   */
  static async verifyToken(): Promise<{ success: boolean; user: User; message: string }> {
    try {
      const token = TokenManager.getToken();
      if (!token) {
        throw new Error("No token found");
      }

      const response = await apiClient.get<{ success: boolean; user: User; message: string }>("/auth/verify");

      // Cast to the expected format since backend returns direct response
      return response as unknown as { success: boolean; user: User; message: string };
    } catch (error) {
      // Remove invalid token
      TokenManager.removeToken();

      return {
        success: false,
        user: {} as User,
        message: error instanceof Error ? error.message : "Token verification failed"
      };
    }
  }

  /**
   * Refresh JWT token
   */
  static async refreshToken(): Promise<ApiResponse<{ token: string; message: string }>> {
    try {
      const response = await apiClient.post<{ token: string; message: string }>("/auth/refresh");

      if (response.success && response.data.token) {
        // Update stored token
        TokenManager.setToken(response.data.token);
      }

      return response;
    } catch (error) {
      // Remove invalid token
      TokenManager.removeToken();

      return {
        data: { token: "", message: "Refresh failed" },
        success: false,
        message: error instanceof Error ? error.message : "Token refresh failed"
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!TokenManager.getToken();
  }

  /**
   * Get stored token
   */
  static getToken(): string | null {
    return TokenManager.getToken();
  }

  /**
   * Clear stored token
   */
  static clearToken(): void {
    TokenManager.removeToken();
  }
}

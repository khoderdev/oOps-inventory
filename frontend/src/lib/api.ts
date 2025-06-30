import { showAccountDeactivatedToast } from "../hooks/useToast";
import type { ApiResponse, RequestData } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.88.86:5000/api";

class TokenManager {
  private static readonly TOKEN_KEY = "auth_token";

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

// Account deactivation handler
class AccountHandler {
  static handleDeactivatedAccount(errorCode?: string, message?: string, isLoginAttempt: boolean = false): void {
    // Remove token since account is deactivated
    TokenManager.removeToken();

    // Only show toast and redirect for authenticated API calls, not login attempts
    if (!isLoginAttempt) {
      // Show user-friendly toast notification
      showAccountDeactivatedToast(message);

      // Redirect to home page where ProtectedRoute will show login
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.href = "/";
        }, 3000); // Give more time for user to see the toast
      }
    }
    // For login attempts, let the error bubble up to the form to handle inline
  }
}

// HTTP Client Class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = TokenManager.getToken();

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);

      // Handle different response types
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle authentication errors
      if (response.status === 401) {
        TokenManager.removeToken();
        // Redirect to root where ProtectedRoute will handle showing login
        window.location.href = "/";
        throw new Error("Authentication required");
      }

      // Handle account deactivation errors
      if (response.status === 403 && data?.code === "ACCOUNT_DEACTIVATED") {
        // Check if this is a login attempt
        const isLoginAttempt = endpoint.includes("/auth/login");
        AccountHandler.handleDeactivatedAccount(data.code, data.error, isLoginAttempt);
        throw new Error(data.error || "Account has been deactivated");
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
      }

      // Ensure consistent response format
      if (typeof data === "object" && data !== null && "success" in data) {
        return data as ApiResponse<T>;
      }

      // Wrap non-standard responses
      return {
        data: data as T,
        success: true
      };
    } catch (error) {
      // Return consistent error format
      return {
        data: {} as T,
        success: false,
        message: error instanceof Error ? error.message : "An error occurred"
      };
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: RequestData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: RequestData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string, data?: RequestData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async patch<T>(endpoint: string, data?: RequestData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined
    });
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export token manager for use in auth context
export { AccountHandler, TokenManager };

// Helper function for handling API responses
export const handleApiResponse = <T>(response: ApiResponse<T>): T => {
  if (!response.success) {
    throw new Error(response.message || "API request failed");
  }
  return response.data;
};

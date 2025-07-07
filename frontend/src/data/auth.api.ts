import { apiClient, TokenManager } from "../lib/api";
import type { ApiResponse, AuthResponse, ChangePasswordData, ChangePasswordResponse, LoginCredentials, RegisterData, UpdateProfileData, UpdateProfileResponse, User } from "../types";

export class AuthAPI {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
      const authResponse = response as unknown as AuthResponse;
      if (authResponse.success && authResponse.token) {
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

  static async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/register", userData);
      const authResponse = response as unknown as AuthResponse;
      if (authResponse.success && authResponse.token) {
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

  static async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<{ message: string }>("/auth/logout");
      TokenManager.removeToken();
      return response;
    } catch {
      TokenManager.removeToken();
      return {
        data: { message: "Logged out" },
        success: true,
        message: "Logged out successfully"
      };
    }
  }

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

  static async verifyToken(): Promise<{ success: boolean; user: User; message: string }> {
    try {
      const token = TokenManager.getToken();
      if (!token) {
        throw new Error("No token found");
      }
      const response = await apiClient.get<{ success: boolean; user: User; message: string }>("/auth/verify");
      return response as unknown as { success: boolean; user: User; message: string };
    } catch (error) {
      TokenManager.removeToken();
      return {
        success: false,
        user: {} as User,
        message: error instanceof Error ? error.message : "Token verification failed"
      };
    }
  }

  static async refreshToken(): Promise<ApiResponse<{ token: string; message: string }>> {
    try {
      const response = await apiClient.post<{ token: string; message: string }>("/auth/refresh");
      if (response.success && response.data.token) {
        TokenManager.setToken(response.data.token);
      }
      return response;
    } catch (error) {
      TokenManager.removeToken();
      return {
        data: { token: "", message: "Refresh failed" },
        success: false,
        message: error instanceof Error ? error.message : "Token refresh failed"
      };
    }
  }

  static isAuthenticated(): boolean {
    return !!TokenManager.getToken();
  }

  static getToken(): string | null {
    return TokenManager.getToken();
  }

  static clearToken(): void {
    TokenManager.removeToken();
  }

  static async changePassword(passwordData: ChangePasswordData): Promise<ChangePasswordResponse> {
    try {
      const response = await apiClient.post<ChangePasswordResponse>("/auth/change-password", passwordData);
      return response as unknown as ChangePasswordResponse;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Password change failed"
      };
    }
  }

  static async updateProfile(profileData: UpdateProfileData): Promise<UpdateProfileResponse> {
    try {
      const response = await apiClient.put<UpdateProfileResponse>("/auth/profile", profileData);
      return response as unknown as UpdateProfileResponse;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Profile update failed",
        user: {} as User
      };
    }
  }
}

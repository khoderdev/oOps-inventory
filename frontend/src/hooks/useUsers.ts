import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UsersAPI } from "../data/users.api";
import type { UserRole, UsersQueryOptions } from "../types/users.types";

const QUERY_KEYS = {
  users: "users",
  user: (id: string) => ["user", id],
  activeUsers: "activeUsers"
} as const;

// Get all users with filters
export const useUsers = (options?: UsersQueryOptions) => {
  const { enabled = true, ...filters } = options || {};

  return useQuery({
    queryKey: [QUERY_KEYS.users, filters],
    queryFn: () => UsersAPI.getAll(filters),
    select: response => response.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
};

// Get single user by ID
export const useUser = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.user(id),
    queryFn: () => UsersAPI.getById(id),
    select: response => response.data,
    enabled: !!id
  });
};

// Get active users (for dropdowns)
export const useActiveUsers = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.activeUsers],
    queryFn: () => UsersAPI.getActiveUsers(),
    select: response => response.data,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create user mutation
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: { firstName: string; lastName: string; email: string; role: UserRole; password: string; isActive?: boolean }) => UsersAPI.create(userData),
    onSuccess: () => {
      // Invalidate users queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });
};

// Update user mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      userData
    }: {
      id: string;
      userData: {
        firstName: string;
        lastName: string;
        email: string;
        role: UserRole;
        isActive: boolean;
        password?: string;
      };
    }) => UsersAPI.update(id, userData),
    onSuccess: () => {
      // Invalidate users queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });
};

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => UsersAPI.delete(id),
    onSuccess: () => {
      // Invalidate users queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });
};

// Toggle user status mutation
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => UsersAPI.toggleStatus(id, isActive),
    onSuccess: () => {
      // Invalidate users queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });
};

import { useQuery } from "@tanstack/react-query";
import type { UserFilters } from "../data/users.api";
import { UsersAPI } from "../data/users.api";

const QUERY_KEYS = {
  users: "users",
  user: (id: string) => ["user", id],
  activeUsers: "activeUsers"
} as const;

// Get all users with filters
export const useUsers = (filters?: UserFilters) => {
  return useQuery({
    queryKey: [QUERY_KEYS.users, filters],
    queryFn: () => UsersAPI.getAll(filters),
    select: response => response.data,
    staleTime: 5 * 60 * 1000 // 5 minutes
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

import { createContext } from "react";
import type { User } from "../types";

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  theme: "light" | "dark";
  sidebarOpen: boolean;
}

export type AppAction = { type: "SET_USER"; payload: User | null } | { type: "SET_LOADING"; payload: boolean } | { type: "SET_THEME"; payload: "light" | "dark" } | { type: "TOGGLE_SIDEBAR" } | { type: "SET_SIDEBAR"; payload: boolean } | { type: "LOGOUT" };

export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience methods
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  logout: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

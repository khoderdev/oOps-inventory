import { useEffect, useReducer, type ReactNode } from "react";
import { AuthAPI } from "../data/auth.api";
import type { User } from "../types";
import { AppContext, type AppAction, type AppContextType, type AppState } from "./AppContext";

// Get initial theme from localStorage or system preference
const getInitialTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    // Check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
};

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check auth status
  theme: getInitialTheme(),
  sidebarOpen: true
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload
      };
    case "SET_THEME":
      return {
        ...state,
        theme: action.payload
      };
    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };
    case "SET_SIDEBAR":
      return {
        ...state,
        sidebarOpen: action.payload
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false
      };
    default:
      return state;
  }
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Check authentication status on app startup
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });

        // Check if we have a token
        if (!AuthAPI.isAuthenticated()) {
          dispatch({ type: "SET_USER", payload: null });
          return;
        }

        // Verify token with backend
        const response = await AuthAPI.verifyToken();

        if (response.success && response.user) {
          dispatch({ type: "SET_USER", payload: response.user });
        } else {
          // Token is invalid, clear it
          AuthAPI.clearToken();
          dispatch({ type: "SET_USER", payload: null });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        AuthAPI.clearToken();
        dispatch({ type: "SET_USER", payload: null });
      }
    };

    checkAuthStatus();
  }, []);

  // Apply theme to document and save to localStorage
  useEffect(() => {
    const root = document.documentElement;

    if (state.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", state.theme);
  }, [state.theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if no theme is saved in localStorage
      if (!localStorage.getItem("theme")) {
        dispatch({ type: "SET_THEME", payload: e.matches ? "dark" : "light" });
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Convenience methods
  const setUser = (user: User | null) => {
    dispatch({ type: "SET_USER", payload: user });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  };

  const setTheme = (theme: "light" | "dark") => {
    dispatch({ type: "SET_THEME", payload: theme });
  };

  const toggleSidebar = () => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  };

  const setSidebar = (open: boolean) => {
    dispatch({ type: "SET_SIDEBAR", payload: open });
  };

  const logout = async () => {
    try {
      await AuthAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: "LOGOUT" });
    }
  };

  const value: AppContextType = {
    state,
    dispatch,
    setUser,
    setLoading,
    setTheme,
    toggleSidebar,
    setSidebar,
    logout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

import { useEffect, useReducer, type ReactNode } from "react";
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
  user: {
    id: "demo-user-1",
    name: "Restaurant Manager",
    role: "manager",
    email: "manager@restaurant.com"
  }, // Demo user for development
  isAuthenticated: true,
  theme: getInitialTheme(),
  sidebarOpen: true
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload
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
    default:
      return state;
  }
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

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

  const setTheme = (theme: "light" | "dark") => {
    dispatch({ type: "SET_THEME", payload: theme });
  };

  const toggleSidebar = () => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  };

  const setSidebar = (open: boolean) => {
    dispatch({ type: "SET_SIDEBAR", payload: open });
  };

  const value: AppContextType = {
    state,
    dispatch,
    setUser,
    setTheme,
    toggleSidebar,
    setSidebar
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

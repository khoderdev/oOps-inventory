import { useReducer, type ReactNode } from "react";
import type { User } from "../types";
import { AppContext, type AppAction, type AppContextType, type AppState } from "./AppContext";

const initialState: AppState = {
  user: {
    id: "demo-user-1",
    name: "Restaurant Manager",
    role: "manager",
    email: "manager@restaurant.com"
  }, // Demo user for development
  isAuthenticated: true,
  theme: "light",
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

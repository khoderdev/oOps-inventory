import { useCallback, useState } from "react";
import type { Toast, ToastType } from "../components/ui/Toast";

interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
  persistent?: boolean;
}

interface UseToastReturn {
  toasts: Toast[];
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((options: ToastOptions): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const toast: Toast = {
      id,
      type: options.type || "info",
      title: options.title,
      message: options.message,
      duration: options.duration ?? 5000,
      persistent: options.persistent ?? false
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback(
    (title: string, message?: string): string => {
      return addToast({ title, message, type: "success" });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string): string => {
      return addToast({ title, message, type: "error", duration: 8000 });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string): string => {
      return addToast({ title, message, type: "warning", duration: 6000 });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string): string => {
      return addToast({ title, message, type: "info" });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info
  };
};

// Global toast instance (singleton pattern)
let globalToastInstance: UseToastReturn | null = null;

export const setGlobalToastInstance = (instance: UseToastReturn) => {
  globalToastInstance = instance;
};

export const getGlobalToast = () => globalToastInstance;

// Utility functions for global toast usage
export const showAccountDeactivatedToast = (message?: string) => {
  const toast = getGlobalToast();
  if (toast) {
    toast.error("Account Deactivated", message || "Your account has been deactivated. Please contact an administrator to reactivate your account.");
  }
};

export const showSuccessToast = (title: string, message?: string) => {
  const toast = getGlobalToast();
  if (toast) {
    toast.success(title, message);
  }
};

export const showErrorToast = (title: string, message?: string) => {
  const toast = getGlobalToast();
  if (toast) {
    toast.error(title, message);
  }
};

import { useEffect } from "react";
import { ToastContainer } from "./components/ui";
import { AppProvider } from "./contexts/AppProvider";
import { setGlobalToastInstance, useToast } from "./hooks/useToast";
import "./index.css";
import { QueryProvider } from "./providers/QueryProvider";
import { AppRouter } from "./router/AppRouter";

function App() {
  const toast = useToast();

  useEffect(() => {
    setGlobalToastInstance(toast);
  }, [toast]);

  return (
    <QueryProvider>
      <AppProvider>
        <AppRouter />
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      </AppProvider>
    </QueryProvider>
  );
}

export default App;

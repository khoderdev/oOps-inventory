import { AppProvider } from "./contexts/AppProvider";
import "./index.css";
import { QueryProvider } from "./providers/QueryProvider";
import { AppRouter } from "./router/AppRouter";

function App() {
  return (
    <QueryProvider>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </QueryProvider>
  );
}

export default App;

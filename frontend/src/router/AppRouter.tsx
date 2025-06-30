import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import ErrorPage from "../components/common/ErrorPage";
import DashboardPage from "../components/dashboard/DashboardPage";
import Layout from "../components/layout/Layout";
import RawMaterialsPage from "../components/rawMaterials/RawMaterialsPage";
import ReportsPage from "../components/reports/ReportsPage";
import SectionsPage from "../components/sections/SectionsPage";
import SettingsPage from "../components/settings/SettingsPage";
import StockManagementPage from "../components/stock/StockManagementPage";
import UsersPage from "../components/users/UsersPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      {
        path: "dashboard",
        element: <DashboardPage />
      },
      {
        path: "raw-materials",
        element: <RawMaterialsPage />
      },
      {
        path: "stock",
        element: <StockManagementPage />
      },
      {
        path: "sections",
        element: <SectionsPage />
      },
      {
        path: "reports",
        element: <ReportsPage />
      },
      {
        path: "settings",
        element: <SettingsPage />
      },
      {
        path: "users",
        element: <UsersPage />
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

import { clsx } from "clsx";
import { BarChart3, Building2, Home, Menu, Package, Settings, Warehouse, X } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../../hooks/useApp";
import Button from "../ui/Button";

const navigationItems = [
  { name: "Dashboard", to: "/dashboard", icon: Home },
  { name: "Raw Materials", to: "/raw-materials", icon: Package },
  { name: "Stock Management", to: "/stock", icon: Warehouse },
  { name: "Sections", to: "/sections", icon: Building2 },
  { name: "Reports", to: "/reports", icon: BarChart3 },
  { name: "Settings", to: "/settings", icon: Settings }
];

const Layout = () => {
  const { state, toggleSidebar } = useApp();
  const { sidebarOpen, user } = state;
  const location = useLocation();

  return (
    <div className="w-full h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className={clsx("bg-white shadow-lg transition-all duration-300 ease-in-out", "fixed inset-y-0 left-0 z-50 w-64 transform", sidebarOpen ? "translate-x-0" : "-translate-x-full", "lg:relative lg:translate-x-0")}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Inventory Pro</h1>
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="lg:hidden">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map(item => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.to || (item.to === "/dashboard" && location.pathname === "/");

              return (
                <NavLink key={item.name} to={item.to} className={clsx("flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors", isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900")}>
                  <IconComponent className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={toggleSidebar} />}
    </div>
  );
};

export default Layout;

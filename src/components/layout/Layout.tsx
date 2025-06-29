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
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={clsx("fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-md transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Inventory Pro</h1>
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="lg:hidden" aria-label="Close sidebar">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            {navigationItems.map(({ name, to, icon: Icon }) => {
              const isActive = location.pathname === to || (to === "/dashboard" && location.pathname === "/");
              return (
                <NavLink key={name} to={to} className={clsx("flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200", isActive ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white")}>
                  <Icon className="w-5 h-5 mr-3" />
                  {name}
                </NavLink>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 bg-blue-600 dark:bg-blue-500 rounded-full text-white text-sm font-semibold">{user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 h-16 shadow-sm">
          <Button variant="ghost" size="sm" onClick={toggleSidebar} className="lg:hidden" aria-label="Open sidebar">
            <Menu className="w-5 h-5" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="mx-auto max-w-screen p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={toggleSidebar} />}
    </div>
  );
};

export default Layout;

import { clsx } from "clsx";
import { BarChart3, Building2, ChefHat, ChevronLeft, ChevronRight, DollarSign, Home, Menu, Package, Settings, Users, Warehouse, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
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

// Admin-only navigation items
const adminNavigationItems = [
  { name: "Restaurant Management", to: "/restaurant-management", icon: ChefHat, adminOnly: true },
  { name: "Cost Control", to: "/cost-control", icon: DollarSign, adminOnly: true },
  { name: "User Management", to: "/users", icon: Users, adminOnly: true }
];

const Layout = () => {
  const { state, toggleSidebar, setSidebar, collapseSidebar, logout } = useApp();
  const { sidebarOpen, sidebarCollapsed, isMobile, user } = state;
  const location = useLocation();

  // Combine navigation items and filter admin-only items
  const allNavigationItems = [...navigationItems, ...adminNavigationItems.filter(item => !item.adminOnly || user?.role === "ADMIN")];

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && sidebarOpen && isMobile) {
      setSidebar(false);
    }
  };

  // Handle mobile navigation click - auto-close sidebar
  const handleMobileNavClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebar(false);
    }
  };

  // Get user display info with proper fallbacks
  const getUserDisplayInfo = () => {
    if (user?.firstName && user?.lastName) {
      return {
        name: `${user.firstName} ${user.lastName}`,
        initials: `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      };
    }
    if (user?.username) {
      return {
        name: user.username,
        initials: user.username.slice(0, 2).toUpperCase()
      };
    }
    if (user?.email) {
      return {
        name: user.email,
        initials: user.email.slice(0, 2).toUpperCase()
      };
    }
    return {
      name: "User",
      initials: "U"
    };
  };

  const userInfo = getUserDisplayInfo();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900" onKeyDown={handleKeyDown}>
      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out",
          // Mobile styles
          isMobile && ["w-72", sidebarOpen ? "translate-x-0" : "-translate-x-full"],
          // Desktop styles
          !isMobile && [sidebarCollapsed ? "w-16" : "w-64", "relative translate-x-0"]
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={clsx("flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50", sidebarCollapsed && !isMobile ? "justify-center" : "justify-between")}>
            {(!sidebarCollapsed || isMobile) && (
              <Link to="/" className="text-lg font-bold text-gray-900 dark:text-white tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                oOps Inventory
              </Link>
            )}

            <div className="flex items-center space-x-1">
              {/* Desktop collapse/expand button */}
              {!isMobile && (
                <Button variant="ghost" size="sm" onClick={() => collapseSidebar(!sidebarCollapsed)} className="hover:bg-gray-200 dark:hover:bg-gray-700" aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
                  {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
              )}

              {/* Mobile close button */}
              {isMobile && (
                <Button variant="ghost" size="sm" onClick={() => setSidebar(false)} className="hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close sidebar">
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1">
            {allNavigationItems.map(({ name, to, icon: Icon }) => {
              const isActive = location.pathname === to || (to === "/dashboard" && location.pathname === "/");
              return (
                <NavLink
                  key={name}
                  to={to}
                  className={clsx("flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative", sidebarCollapsed && !isMobile ? "justify-center" : "justify-start", isActive ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white")}
                  title={sidebarCollapsed && !isMobile ? name : undefined}
                  aria-label={name}
                  onClick={handleMobileNavClick}
                >
                  <Icon className={clsx("flex-shrink-0 transition-transform duration-200", sidebarCollapsed && !isMobile ? "w-5 h-5" : "w-5 h-5 mr-3", isActive && "scale-110")} />

                  {(!sidebarCollapsed || isMobile) && <span className="truncate">{name}</span>}

                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && !isMobile && <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">{name}</div>}
                </NavLink>
              );
            })}
          </nav>

          {/* User Info */}
          <div className={clsx("px-3 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50", sidebarCollapsed && !isMobile ? "text-center" : "")}>
            <div className={clsx("flex items-center", sidebarCollapsed && !isMobile ? "justify-center" : "gap-3")}>
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full text-white text-sm font-bold shadow-md">{userInfo.initials}</div>

              {(!sidebarCollapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userInfo.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
              )}
            </div>

            {(!sidebarCollapsed || isMobile) && (
              <Button variant="ghost" size="sm" className="w-full mt-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors" onClick={logout}>
                Sign out
              </Button>
            )}

            {/* Collapsed state logout button */}
            {sidebarCollapsed && !isMobile && (
              <Button variant="ghost" size="sm" className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors justify-center" onClick={logout} title="Sign out" aria-label="Sign out">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 h-16 shadow-sm backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
          <div className="flex items-center space-x-4">
            {isMobile && (
              <Button variant="ghost" size="sm" onClick={toggleSidebar} className="hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Open sidebar">
                <Menu className="w-5 h-5" />
              </Button>
            )}

            <div className="block">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{allNavigationItems.find(item => location.pathname === item.to || (item.to === "/dashboard" && location.pathname === "/"))?.name || "Dashboard"}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden md:inline">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className={clsx("flex-1 bg-gray-50 dark:bg-gray-900", isMobile && sidebarOpen ? "overflow-hidden" : "overflow-y-auto")}>
          <div className="mx-auto max-w-screen p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebar(false)}
          aria-label="Close sidebar"
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              setSidebar(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default Layout;

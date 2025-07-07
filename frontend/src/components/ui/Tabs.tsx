import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";

export interface Tab<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
  badge?: string | number;
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  className?: string;
  variant?: "default" | "pills" | "minimal";
  size?: "sm" | "md" | "lg";
  scrollable?: boolean;
}

const Tabs = <T extends string>({ tabs, activeTab, onTabChange, className, variant = "default", size = "md", scrollable = true }: TabsProps<T>) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to active tab on mobile
  useEffect(() => {
    if (activeTabRef.current && tabsRef.current && scrollable) {
      const tabElement = activeTabRef.current;
      const containerElement = tabsRef.current;

      const tabLeft = tabElement.offsetLeft;
      const tabWidth = tabElement.offsetWidth;
      const containerWidth = containerElement.offsetWidth;
      const containerScrollLeft = containerElement.scrollLeft;

      // Check if tab is fully visible
      if (tabLeft < containerScrollLeft || tabLeft + tabWidth > containerScrollLeft + containerWidth) {
        // Scroll to center the active tab
        const scrollLeft = tabLeft - containerWidth / 2 + tabWidth / 2;
        containerElement.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: "smooth"
        });
      }
    }
  }, [activeTab, scrollable]);

  // Size classes
  const sizeClasses = {
    sm: "py-2 px-3 text-xs",
    md: "py-3 px-4 text-sm",
    lg: "py-4 px-6 text-base"
  };

  // Variant-specific classes
  const getVariantClasses = (isActive: boolean, disabled: boolean) => {
    const baseClasses = "font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap";

    if (disabled) {
      return `${baseClasses} opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600`;
    }

    switch (variant) {
      case "pills":
        return `${baseClasses} rounded-full ${isActive ? "bg-blue-600 text-white shadow-md transform scale-105" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`;

      case "minimal":
        return `${baseClasses} ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`;

      default: // "default" with bottom border
        return `${baseClasses} border-b-2 ${isActive ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"}`;
    }
  };

  // Container classes based on variant
  const getContainerClasses = () => {
    const baseClasses = scrollable ? "flex overflow-x-auto" : "flex flex-wrap";

    switch (variant) {
      case "pills":
        return `${baseClasses} gap-2 p-2`;
      case "minimal":
        return `${baseClasses} gap-6`;
      default:
        return `${baseClasses} border-b border-gray-200 dark:border-gray-700`;
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, tabId: T) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onTabChange(tabId);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
      const nextTab = tabs[nextIndex];

      if (nextTab && !nextTab.disabled) {
        onTabChange(nextTab.id);
      }
    }
  };

  return (
    <div className={clsx("w-full", className)}>
      <div ref={tabsRef} className={getContainerClasses()} role="tablist" aria-orientation="horizontal">
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          const IconComponent = tab.icon;

          return (
            <button key={tab.id} ref={isActive ? activeTabRef : undefined} onClick={() => !tab.disabled && onTabChange(tab.id)} onKeyDown={e => handleKeyDown(e, tab.id)} className={clsx(sizeClasses[size], getVariantClasses(isActive, !!tab.disabled), variant === "default" && scrollable && "flex-shrink-0")} role="tab" aria-selected={isActive} aria-controls={`tabpanel-${tab.id}`} aria-label={tab.label} disabled={tab.disabled} tabIndex={isActive ? 0 : -1}>
              {IconComponent && <IconComponent className={clsx("flex-shrink-0", size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4")} />}

              <span className="truncate">{tab.label}</span>

              {tab.badge && <span className={clsx("inline-flex items-center justify-center rounded-full text-xs font-medium min-w-5 h-5 px-1.5", isActive ? "bg-white text-blue-600" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300")}>{tab.badge}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;

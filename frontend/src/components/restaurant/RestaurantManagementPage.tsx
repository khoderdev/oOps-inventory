import React, { useState } from "react";
import { useApp } from "../../hooks/useApp";
import { BudgetsTab } from "./tabs/BudgetsTab";
import { PurchaseOrdersTab } from "./tabs/PurchaseOrdersTab";
import { RecipesTab } from "./tabs/RecipesTab";
import { SuppliersTab } from "./tabs/SuppliersTab";

export const RestaurantManagementPage: React.FC = () => {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState("overview");

  // Check if user is admin
  if (state.user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1 dark:text-gray-100">Access Denied</h3>
          <p className="text-gray-500 dark:text-gray-400">You need administrator privileges to access restaurant management.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "purchase-orders", label: "Purchase Orders", icon: "📋" },
    { id: "suppliers", label: "Suppliers", icon: "🏭" },
    { id: "recipes", label: "Recipes & Menu", icon: "👨‍🍳" },
    { id: "budgets", label: "Budget Planning", icon: "💰" }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center dark:bg-blue-600">
                      <span className="text-white text-sm dark:text-white">📋</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Purchase Orders</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">-</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center dark:bg-green-600">
                      <span className="text-white text-sm">🏭</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Active Suppliers</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">-</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center dark:bg-purple-600">
                      <span className="text-white text-sm">👨‍🍳</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Recipes</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">-</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center dark:bg-yellow-600">
                      <span className="text-white text-sm">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Active Budgets</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">-</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Restaurant Management System</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>This comprehensive system allows you to manage all aspects of your restaurant operations. Use the tabs above to navigate between different management areas.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "purchase-orders":
        return <PurchaseOrdersTab />;
      case "suppliers":
        return <SuppliersTab />;
      case "recipes":
        return <RecipesTab />;
      case "budgets":
        return <BudgetsTab />;
      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">🚧</div>
              <h3 className="text-lg font-medium mb-2">Feature Coming Soon</h3>
              <p>This feature is currently being implemented.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="bg-white shadow dark:bg-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Restaurant Management</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Comprehensive restaurant operations control panel</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:text-green-400 dark:bg-green-600">Admin Access</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:text-blue-400 dark:bg-blue-600">Live Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 dark:shadow-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700 ">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                    ${activeTab === tab.id ? "border-blue-500 text-blue-600 dark:border-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"}
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

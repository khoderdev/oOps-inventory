import { Bell, Database, Palette, Save, Shield, User } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../hooks/useApp";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

type SettingsTab = "profile" | "notifications" | "system" | "security" | "appearance";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { state, setUser, setTheme } = useApp();

  const [profileData, setProfileData] = useState({
    firstName: state.user?.firstName || "",
    lastName: state.user?.lastName || "",
    email: state.user?.email || "",
    role: state.user?.role || "STAFF"
  });

  const [systemSettings, setSystemSettings] = useState({
    lowStockThreshold: "10",
    defaultExpiryDays: "30",
    autoBackup: "daily"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlerts: true,
    expiryAlerts: true,
    systemUpdates: false
  });

  const tabs = [
    { id: "profile" as SettingsTab, label: "Profile", icon: User },
    { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
    { id: "system" as SettingsTab, label: "System", icon: Database },
    { id: "security" as SettingsTab, label: "Security", icon: Shield },
    { id: "appearance" as SettingsTab, label: "Appearance", icon: Palette }
  ];

  // Filter tabs based on user role - hide system tab for non-MANAGER/ADMIN users
  const visibleTabs = tabs.filter(tab => {
    if (tab.id === "system") {
      return state.user?.role === "MANAGER" || state.user?.role === "ADMIN";
    }
    return true;
  });

  const handleSaveProfile = () => {
    setUser({
      id: state.user?.id || "demo-user-1",
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      email: profileData.email,
      role: profileData.role as "MANAGER" | "STAFF" | "ADMIN",
      isActive: state.user?.isActive || true,
      createdAt: state.user?.createdAt,
      updatedAt: state.user?.updatedAt
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Information</h3>

              {/* Basic Information Section */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="First Name" value={profileData.firstName} onChange={e => setProfileData(prev => ({ ...prev, firstName: e.target.value }))} placeholder="Enter your first name" required />

                  <Input label="Last Name" value={profileData.lastName} onChange={e => setProfileData(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Enter your last name" required />

                  <Input label="Email Address" type="email" value={profileData.email} onChange={e => setProfileData(prev => ({ ...prev, email: e.target.value }))} placeholder="Enter your email address" required />

                  {/* Role field - only editable by admins */}
                  {state.user?.role === "ADMIN" ? (
                    <Select
                      label="Role"
                      options={[
                        { value: "ADMIN", label: "Administrator" },
                        { value: "MANAGER", label: "Manager" },
                        { value: "STAFF", label: "Staff" }
                      ]}
                      value={profileData.role}
                      onChange={e => setProfileData(prev => ({ ...prev, role: e.target.value as "ADMIN" | "MANAGER" | "STAFF" }))}
                    />
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-gray-900 dark:text-white text-sm">{profileData.role === "ADMIN" ? "Administrator" : profileData.role === "MANAGER" ? "Manager" : "Staff"}</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contact an administrator to change your role</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Information Section */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Account Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User ID</label>
                    <p className="text-gray-900 dark:text-white font-mono text-sm">{state.user?.id || "N/A"}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${state.user?.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"}`}>{state.user?.isActive ? "Active" : "Inactive"}</span>
                  </div>

                  {state.user?.createdAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Member Since</label>
                      <p className="text-gray-900 dark:text-white text-sm">
                        {new Date(state.user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                  )}

                  {state.user?.updatedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Updated</label>
                      <p className="text-gray-900 dark:text-white text-sm">
                        {new Date(state.user.updatedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} leftIcon={<Save className="w-4 h-4" />}>
                  Save Profile Changes
                </Button>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Low Stock Alerts</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when items are running low</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.lowStockAlerts}
                      onChange={e =>
                        setNotificationSettings(prev => ({
                          ...prev,
                          lowStockAlerts: e.target.checked
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Expiry Alerts</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about expiring items</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.expiryAlerts}
                      onChange={e =>
                        setNotificationSettings(prev => ({
                          ...prev,
                          expiryAlerts: e.target.checked
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">System Updates</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about system updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.systemUpdates}
                      onChange={e =>
                        setNotificationSettings(prev => ({
                          ...prev,
                          systemUpdates: e.target.checked
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      case "system":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Low Stock Threshold (%)"
                  type="number"
                  value={systemSettings.lowStockThreshold}
                  onChange={e =>
                    setSystemSettings(prev => ({
                      ...prev,
                      lowStockThreshold: e.target.value
                    }))
                  }
                  helperText="Percentage of minimum stock to trigger alerts"
                />

                <Input
                  label="Default Expiry Days"
                  type="number"
                  value={systemSettings.defaultExpiryDays}
                  onChange={e =>
                    setSystemSettings(prev => ({
                      ...prev,
                      defaultExpiryDays: e.target.value
                    }))
                  }
                  helperText="Default days before expiry for new items"
                />

                <Select
                  label="Auto Backup Frequency"
                  options={[
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly" },
                    { value: "monthly", label: "Monthly" },
                    { value: "disabled", label: "Disabled" }
                  ]}
                  value={systemSettings.autoBackup}
                  onChange={e =>
                    setSystemSettings(prev => ({
                      ...prev,
                      autoBackup: e.target.value
                    }))
                  }
                />
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This is a demo application. In a production environment, this section would include password management, two-factor authentication, session management, and access control settings.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button variant="outline">Change Password</Button>
                  <Button variant="outline">Enable Two-Factor Authentication</Button>
                  <Button variant="outline">View Login History</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setTheme("light")} className={`p-4 rounded-lg border-2 transition-all duration-200 ${state.theme === "light" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"}`}>
                      <div className="w-full h-8 bg-white border border-gray-200 rounded mb-2 flex items-center justify-center">
                        <div className="w-3 h-3 bg-gray-300 rounded-full mr-1"></div>
                        <div className="w-8 h-1 bg-gray-200 rounded"></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Light</p>
                        {state.theme === "light" && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                      </div>
                    </button>

                    <button onClick={() => setTheme("dark")} className={`p-4 rounded-lg border-2 transition-all duration-200 ${state.theme === "dark" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"}`}>
                      <div className="w-full h-8 bg-gray-800 border border-gray-700 rounded mb-2 flex items-center justify-center">
                        <div className="w-3 h-3 bg-gray-600 rounded-full mr-1"></div>
                        <div className="w-8 h-1 bg-gray-700 rounded"></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Dark</p>
                        {state.theme === "dark" && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                      </div>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Choose your preferred theme. Changes are applied immediately and saved automatically.</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your application preferences and configuration</p>
      </div>

      {/* Settings Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
            <nav className="space-y-1 p-6">
              {visibleTabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-left ${activeTab === tab.id ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"}`}>
                    <IconComponent className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 p-6 dark:bg-gray-800">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

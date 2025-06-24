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
    name: state.user?.name || "",
    email: state.user?.email || "",
    role: state.user?.role || "staff"
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

  const handleSaveProfile = () => {
    setUser({
      id: state.user?.id || "demo-user-1",
      name: profileData.name,
      email: profileData.email,
      role: profileData.role as "manager" | "staff"
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Full Name" value={profileData.name} onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))} placeholder="Enter your full name" />

                <Input label="Email Address" type="email" value={profileData.email} onChange={e => setProfileData(prev => ({ ...prev, email: e.target.value }))} placeholder="Enter your email" />

                <Select
                  label="Role"
                  options={[
                    { value: "manager", label: "Manager" },
                    { value: "staff", label: "Staff" }
                  ]}
                  value={profileData.role}
                  onChange={e => setProfileData(prev => ({ ...prev, role: e.target.value as "manager" | "staff" }))}
                />
              </div>

              <div className="mt-6">
                <Button onClick={handleSaveProfile} leftIcon={<Save className="w-4 h-4" />}>
                  Save Profile
                </Button>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Low Stock Alerts</p>
                    <p className="text-sm text-gray-600">Get notified when items are running low</p>
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
                    <p className="font-medium text-gray-900">Expiry Alerts</p>
                    <p className="text-sm text-gray-600">Get notified about expiring items</p>
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
                    <p className="font-medium text-gray-900">System Updates</p>
                    <p className="text-sm text-gray-600">Get notified about system updates</p>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Configuration</h3>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setTheme("light")} className={`p-4 rounded-lg border-2 transition-colors ${state.theme === "light" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className="w-full h-8 bg-white rounded mb-2 border"></div>
                      <p className="text-sm font-medium">Light</p>
                    </button>

                    <button onClick={() => setTheme("dark")} className={`p-4 rounded-lg border-2 transition-colors ${state.theme === "dark" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className="w-full h-8 bg-gray-800 rounded mb-2"></div>
                      <p className="text-sm font-medium">Dark</p>
                    </button>
                  </div>
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
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your application preferences and configuration</p>
      </div>

      {/* Settings Content */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-gray-200">
            <nav className="space-y-1 p-6">
              {tabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-left ${activeTab === tab.id ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"}`}>
                    <IconComponent className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 p-6">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

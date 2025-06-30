import { Bell, Database, Eye, EyeOff, Palette, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthAPI } from "../../data/auth.api";
import { useApp } from "../../hooks/useApp";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

type SettingsTab = "profile" | "notifications" | "system" | "appearance";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { state, setUser, setTheme } = useApp();

  const [profileData, setProfileData] = useState({
    firstName: state.user?.firstName || "",
    lastName: state.user?.lastName || "",
    email: state.user?.email || "",
    role: state.user?.role || "STAFF"
  });

  // Sync profileData with global user state when user changes
  useEffect(() => {
    if (state.user) {
      setProfileData({
        firstName: state.user.firstName || "",
        lastName: state.user.lastName || "",
        email: state.user.email || "",
        role: state.user.role || "STAFF"
      });
    }
  }, [state.user]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

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
    { id: "appearance" as SettingsTab, label: "Appearance", icon: Palette }
  ];

  // Filter tabs based on user role - hide system tab for non-MANAGER/ADMIN users
  const visibleTabs = tabs.filter(tab => {
    if (tab.id === "system") {
      return state.user?.role === "MANAGER" || state.user?.role === "ADMIN";
    }
    return true;
  });

  const handleSaveProfile = async () => {
    // Basic validation
    if (!profileData.firstName.trim()) {
      alert("First name is required");
      return;
    }

    if (!profileData.lastName.trim()) {
      alert("Last name is required");
      return;
    }

    if (!profileData.email.trim()) {
      alert("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const response = await AuthAPI.updateProfile({
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email.trim()
        // Note: role updates are handled separately by admins only
      });

      if (response.success) {
        // Update the user in global state with the response data
        setUser(response.user);

        alert("Profile updated successfully!");
      } else {
        alert(response.message || "Failed to update profile");
      }
    } catch (error) {
      alert("An error occurred while updating profile. Please try again.");
      console.error("Profile update error:", error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate password fields
    if (!passwordData.currentPassword) {
      alert("Please enter your current password");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("New password must be at least 6 characters long");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await AuthAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.success) {
        alert("Password changed successfully!");

        // Clear password fields
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });

        // Clear password visibility
        setPasswordVisibility({
          currentPassword: false,
          newPassword: false,
          confirmPassword: false
        });
      } else {
        alert(response.message || "Failed to change password");
      }
    } catch (error) {
      alert("An error occurred while changing password. Please try again.");
      console.error("Password change error:", error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: "currentPassword" | "newPassword" | "confirmPassword") => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
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

              {/* Password Security Section */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Password Security</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Password */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                    <div className="relative">
                      <input
                        type={passwordVisibility.currentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={e => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter your current password"
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 pr-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                      <button type="button" onClick={() => togglePasswordVisibility("currentPassword")} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        {passwordVisibility.currentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div></div> {/* Empty div for grid alignment */}
                  {/* New Password */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                    <div className="relative">
                      <input
                        type={passwordVisibility.newPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={e => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password (min. 6 characters)"
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 pr-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                      <button type="button" onClick={() => togglePasswordVisibility("newPassword")} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        {passwordVisibility.newPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Password must be at least 6 characters long</p>
                  </div>
                  {/* Confirm New Password */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={passwordVisibility.confirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={e => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm your new password"
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 pr-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                      <button type="button" onClick={() => togglePasswordVisibility("confirmPassword")} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        {passwordVisibility.confirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button onClick={handlePasswordChange} variant="outline" disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || isChangingPassword}>
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} leftIcon={<Save className="w-4 h-4" />} disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? "Saving..." : "Save Profile Changes"}
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

import { Check, Lock, Mail, Pencil, User as UserIcon, X } from "lucide-react";
import React, { useState } from "react";
import { AuthAPI } from "../../data/auth.api";
import { useApp } from "../../hooks/useApp";
import { Button, Input } from "../ui";
import { Avatar } from "../ui/Avatar";

export const UserProfile: React.FC = () => {
  const { state, setUser } = useApp();
  const [editMode, setEditMode] = useState<"profile" | "password" | null>(null);
  const [formData, setFormData] = useState({
    firstName: state.user?.firstName || "",
    lastName: state.user?.lastName || "",
    email: state.user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [, setSuccessMessage] = useState("");
  const [, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfileForm()) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await AuthAPI.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      });

      if (response.success && response.user) {
        setUser(response.user);
        setSuccessMessage("Profile updated successfully");
        setEditMode(null);
        // Reset form data with updated user info
        setFormData(prev => ({
          ...prev,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email
        }));
      } else {
        setErrorMessage(response.message || "Failed to update profile");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await AuthAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.success) {
        setSuccessMessage("Password changed successfully");
        setEditMode(null);
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
      } else {
        setErrorMessage(response.message || "Failed to change password");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditMode(null);
    setErrors({});
    setErrorMessage("");
    setSuccessMessage("");
    // Reset form data to current user info
    if (state.user) {
      setFormData({
        firstName: state.user.firstName || "",
        lastName: state.user.lastName || "",
        email: state.user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
  };

  if (!state.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left column - Profile info */}
        <div className="md:w-1/3">
          <div className="flex flex-col items-center">
            <Avatar name={`${state.user?.firstName} ${state.user?.lastName}`} size="xl" className="mb-4" />
            <h2 className="text-2xl font-bold text-center">
              {state.user?.firstName} {state.user?.lastName}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-2">@{state.user?.username}</p>
            <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{state.user?.role}</span>

            <div className="mt-6 w-full space-y-4">
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Mail className="w-5 h-5 mr-2" />
                <span>{state.user?.email || "No email provided"}</span>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <UserIcon className="w-5 h-5 mr-2" />
                <span>Member since {state.user?.createdAt}</span>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <span className={`w-2 h-2 rounded-full mr-2 ${state.user?.isActive ? "bg-green-500" : "bg-red-500"}`}></span>
                <span>{state.user?.isActive ? "Active account" : "Inactive account"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Editable fields */}
        <div className="md:w-2/3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Profile Information</h3>
            {editMode !== "profile" && (
              <Button variant="outline" size="sm" onClick={() => setEditMode("profile")}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* Profile Form */}
          {editMode === "profile" ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} error={errors.firstName} />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} error={errors.email} />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={cancelEdit} disabled={isSubmitting}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Saving..."
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">First Name</label>
                <p className="text-gray-900 dark:text-gray-100">{state.user?.firstName || "Not provided"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Last Name</label>
                <p className="text-gray-900 dark:text-gray-100">{state.user?.lastName || "Not provided"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                <p className="text-gray-900 dark:text-gray-100">{state.user?.email || "Not provided"}</p>
              </div>
            </div>
          )}

          {/* Password Section */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Password</h3>
              {editMode !== "password" && (
                <Button variant="outline" size="sm" onClick={() => setEditMode("password")}>
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              )}
            </div>

            {editMode === "password" ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <Input id="currentPassword" name="currentPassword" type="password" value={formData.currentPassword} onChange={handleInputChange} error={errors.currentPassword} />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <Input id="newPassword" name="newPassword" type="password" value={formData.newPassword} onChange={handleInputChange} error={errors.newPassword} />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} error={errors.confirmPassword} />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" onClick={cancelEdit} disabled={isSubmitting}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      "Changing..."
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Lock className="w-5 h-5 mr-2" />
                <span>Last changed: {state.user?.updatedAt ? (state.user.updatedAt as string) : "Unknown"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import { useEffect, useState } from "react";
import { UsersAPI } from "../../data/users.api";
import { UserRole, type UserFormProps, type UserSubmitData } from "../../types/users.types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

const UserForm = ({ initialData, onSuccess, onCancel }: UserFormProps) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: UserRole.STAFF,
    password: "",
    confirmPassword: "",
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        email: initialData.email,
        role: initialData.role as UserRole,
        password: "",
        confirmPassword: "",
        isActive: initialData.isActive ?? true
      });
    }
  }, [initialData]);

  const roleOptions = [
    { value: UserRole.STAFF, label: "Staff" },
    { value: UserRole.MANAGER, label: "Manager" },
    { value: UserRole.ADMIN, label: "Administrator" }
  ];

  const statusOptions = [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    // Password validation (only for new users or if password is being changed)
    if (!initialData || formData.password) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters long";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Prepare data for submission
      const submitData: UserSubmitData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        role: formData.role as UserRole,
        isActive: formData.isActive
      };

      // Only include password if it's a new user or password is being changed
      if (!initialData || formData.password) {
        submitData.password = formData.password;
      }

      let response;
      if (initialData) {
        // Update existing user
        response = await UsersAPI.update(initialData.id, {
          firstName: submitData.firstName,
          lastName: submitData.lastName,
          email: submitData.email,
          role: submitData.role,
          isActive: submitData.isActive,
          password: submitData.password
        });
      } else {
        // Create new user
        response = await UsersAPI.create({
          firstName: submitData.firstName,
          lastName: submitData.lastName,
          email: submitData.email,
          role: submitData.role,
          password: submitData.password!,
          isActive: submitData.isActive
        });
      }

      if (response.success) {
        onSuccess();
      } else {
        // Show error message to user
        alert(response.message || "Failed to save user");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("An unexpected error occurred while saving the user");
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="First Name" value={formData.firstName} onChange={e => handleInputChange("firstName", e.target.value)} error={errors.firstName} required placeholder="Enter first name" />

        <Input label="Last Name" value={formData.lastName} onChange={e => handleInputChange("lastName", e.target.value)} error={errors.lastName} required placeholder="Enter last name" />
      </div>

      <Input label="Email Address" type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} error={errors.email} required placeholder="Enter email address" />

      {/* Role and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select label="Role" options={roleOptions} value={formData.role} onChange={e => handleInputChange("role", e.target.value)} required />

        <Select label="Status" options={statusOptions} value={formData.isActive.toString()} onChange={e => handleInputChange("isActive", e.target.value === "true")} required />
      </div>

      {/* Password Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{initialData ? "Change Password (Optional)" : "Set Password"}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label={initialData ? "New Password (leave blank to keep current)" : "Password"} type="password" value={formData.password} onChange={e => handleInputChange("password", e.target.value)} error={errors.password} required={!initialData} placeholder="Enter password" />

          <Input label="Confirm Password" type="password" value={formData.confirmPassword} onChange={e => handleInputChange("confirmPassword", e.target.value)} error={errors.confirmPassword} required={!initialData || formData.password.length > 0} placeholder="Confirm password" />
        </div>
      </div>

      {/* Role Description */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Role Permissions:</h4>
        {formData.role === UserRole.ADMIN && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            • Full system access including user management
            <br />
            • Can create, edit, and delete all data
            <br />• Can manage other users and system settings
          </p>
        )}
        {formData.role === UserRole.MANAGER && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            • Can manage inventory, sections, and reports
            <br />
            • Cannot manage users or system settings
            <br />• Can view all operational data
          </p>
        )}
        {formData.role === UserRole.STAFF && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            • Can view and update assigned sections
            <br />
            • Limited access to inventory operations
            <br />• Cannot access management features
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initialData ? "Update User" : "Create User"}</Button>
      </div>
    </form>
  );
};

export default UserForm;

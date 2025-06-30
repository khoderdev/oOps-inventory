import { XCircle } from "lucide-react";
import React, { useState } from "react";
import { AuthAPI } from "../../data/auth.api";
import { useApp } from "../../hooks/useApp";
import { Button, Input } from "../ui";

// Inline error component with toast-like styling
const AccountDeactivatedError: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 p-4 rounded-lg shadow-lg">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-0.5">
        <XCircle className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium">Account Deactivated</h4>
        <p className="mt-1 text-sm opacity-90">{message}</p>
      </div>
    </div>
  </div>
);

export const LoginForm: React.FC = () => {
  const { setUser } = useApp();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [isAccountDeactivated, setIsAccountDeactivated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
      setIsAccountDeactivated(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setError("Please fill in all fields");
      setIsAccountDeactivated(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setIsAccountDeactivated(false);

    try {
      const response = await AuthAPI.login({
        username: formData.username,
        password: formData.password
      });

      if (response.success && response.user) {
        setUser(response.user);
      } else {
        const errorMessage = response.message || "Login failed";

        // Check if this is an account deactivated error
        if (errorMessage.includes("deactivated")) {
          setIsAccountDeactivated(true);
        }

        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred during login";

      // Check if this is an account deactivated error
      if (errorMessage.includes("deactivated")) {
        setIsAccountDeactivated(true);
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">Inventory Management System</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <Input id="username" name="username" type="text" autoComplete="username" required value={formData.username} onChange={handleInputChange} className="mt-1" placeholder="Enter your username" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required value={formData.password} onChange={handleInputChange} className="mt-1" placeholder="Enter your password" />
            </div>
          </div>

          {/* Account Deactivated Error */}
          {error && isAccountDeactivated && <AccountDeactivatedError message={error} />}

          {/* Regular Errors */}
          {error && !isAccountDeactivated && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm dark:bg-red-900 dark:border-red-800 dark:text-red-200">{error}</div>}

          <div>
            <Button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

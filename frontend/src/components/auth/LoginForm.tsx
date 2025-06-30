import React, { useState } from "react";
import { AuthAPI } from "../../data/auth.api";
import { useApp } from "../../hooks/useApp";
import { Button, Input } from "../ui";

export const LoginForm: React.FC = () => {
  const { setUser, setLoading } = useApp();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setError(null);

    try {
      const response = await AuthAPI.login({
        email: formData.email,
        password: formData.password
      });

      if (response.success && response.user) {
        // Set user in context
        setUser(response.user);

        // Redirect or update UI as needed
        console.log("Login successful:", response.user);
      } else {
        setError(response.message || "Login failed");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred during login");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Inventory Management System</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <Input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleInputChange} className="mt-1" placeholder="Enter your email" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required value={formData.password} onChange={handleInputChange} className="mt-1" placeholder="Enter your password" />
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">{error}</div>}

          <div>
            <Button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">Demo credentials: manager@restaurant.com / password123</p>
        </div>
      </div>
    </div>
  );
};

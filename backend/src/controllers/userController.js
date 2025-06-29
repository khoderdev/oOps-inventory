import { asyncHandler } from "../middleware/errorHandler.js";
import { changePassword, deleteUser, getAllUsers, getUserById, updateUser, updateUserRole, updateUserStatus } from "../services/userService.js";
import { changePasswordSchema, updateProfileSchema, updateRoleSchema, validateData } from "../utils/validation.js";

/**
 * Get all users with pagination and filtering
 * GET /api/users
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search, isActive } = req.query;
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    role,
    search,
    isActive: isActive !== undefined ? isActive === "true" : undefined
  };
  const result = await getAllUsers(options);
  res.json({
    success: true,
    data: result
  });
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID"
    });
  }

  const user = await getUserById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found"
    });
  }

  res.json({
    success: true,
    user
  });
});

/**
 * Update user profile
 * PUT /api/users/:id
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID"
    });
  }

  // Validate request data
  const validation = validateData(updateProfileSchema, req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: validation.errors
    });
  }

  const updatedUser = await updateUser(userId, validation.data);

  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      error: "User not found"
    });
  }

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser
  });
});

/**
 * Update user role (admin only)
 * PUT /api/users/:id/role
 */
export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID"
    });
  }

  // Validate request data
  const validation = validateData(updateRoleSchema, req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: validation.errors
    });
  }

  // Prevent user from changing their own role
  if (userId === req.user.id) {
    return res.status(403).json({
      success: false,
      error: "You cannot change your own role"
    });
  }

  const { role } = validation.data;
  const updatedUser = await updateUserRole(userId, role);

  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      error: "User not found"
    });
  }

  res.json({
    success: true,
    message: "User role updated successfully",
    user: updatedUser
  });
});

/**
 * Delete user (admin only)
 * DELETE /api/users/:id
 */
export const deleteUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID"
    });
  }

  // Prevent user from deleting themselves
  if (userId === req.user.id) {
    return res.status(403).json({
      success: false,
      error: "You cannot delete your own account"
    });
  }

  const deleted = await deleteUser(userId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: "User not found"
    });
  }

  res.json({
    success: true,
    message: "User deleted successfully"
  });
});

/**
 * Change user password
 * POST /api/users/:id/change-password
 */
export const changeUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID"
    });
  }

  // Validate request data
  const validation = validateData(changePasswordSchema, req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: validation.errors
    });
  }

  const { currentPassword, newPassword } = validation.data;
  const success = await changePassword(userId, currentPassword, newPassword);

  if (!success) {
    return res.status(404).json({
      success: false,
      error: "Failed to change password"
    });
  }

  res.json({
    success: true,
    message: "Password changed successfully"
  });
});

/**
 * Update user status (activate/deactivate)
 * PUT /api/users/:id/status
 */
export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);
  const { isActive } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID"
    });
  }

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      error: "isActive must be a boolean value"
    });
  }

  // Prevent user from deactivating themselves
  if (userId === req.user.id && !isActive) {
    return res.status(403).json({
      success: false,
      error: "You cannot deactivate your own account"
    });
  }

  const updatedUser = await updateUserStatus(userId, isActive);

  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      error: "User not found"
    });
  }

  res.json({
    success: true,
    message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    user: updatedUser
  });
});

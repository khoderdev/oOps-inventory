import { asyncHandler } from "../middleware/errorHandler.js";
import * as userService from "../services/index.js";
import { changePasswordSchema, updateProfileSchema, updateRoleSchema, validateData } from "../utils/validation.js";

export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search, isActive } = req.query;
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    role,
    search,
    isActive: isActive !== undefined ? isActive === "true" : undefined
  };
  const result = await userService.getAllUsers(options);
  res.json({
    success: true,
    data: result
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID"
    });
  }

  const user = await userService.getUserById(userId);

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

export const updateProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID"
    });
  }

  // Check if the user being updated is active (for self-updates)
  if (userId === req.user.id && !req.user.is_active) {
    return res.status(403).json({
      success: false,
      error: "Your account has been deactivated. Please contact an administrator to reactivate your account.",
      code: "ACCOUNT_DEACTIVATED"
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

  const updatedUser = await userService.updateUser(userId, validation.data);

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

export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID"
    });
  }

  // Check if the current user (admin) is active
  if (!req.user.is_active) {
    return res.status(403).json({
      success: false,
      error: "Your account has been deactivated. Please contact another administrator to reactivate your account.",
      code: "ACCOUNT_DEACTIVATED"
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
  const updatedUser = await userService.updateUserRole(userId, role);

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

export const deleteUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID"
    });
  }

  // Check if the current user (admin) is active
  if (!req.user.is_active) {
    return res.status(403).json({
      success: false,
      error: "Your account has been deactivated. Please contact another administrator to reactivate your account.",
      code: "ACCOUNT_DEACTIVATED"
    });
  }

  // Prevent user from deleting themselves
  if (userId === req.user.id) {
    return res.status(403).json({
      success: false,
      error: "You cannot delete your own account"
    });
  }

  const deleted = await userService.deleteUser(userId);

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

export const changeUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID"
    });
  }

  // Check if the current user (admin) is active
  if (!req.user.is_active) {
    return res.status(403).json({
      success: false,
      error: "Your account has been deactivated. Please contact another administrator to reactivate your account.",
      code: "ACCOUNT_DEACTIVATED"
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

  try {
    const success = await userService.changePassword(userId, currentPassword, newPassword);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to change password"
      });
    }

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    // Handle specific password change errors
    if (error.message === "Current password is incorrect") {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect"
      });
    }

    if (error.message === "User account is inactive") {
      return res.status(403).json({
        success: false,
        error: "The target user account has been deactivated. Please contact an administrator to reactivate the account.",
        code: "TARGET_ACCOUNT_DEACTIVATED"
      });
    }

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Re-throw other errors to be handled by the error handler
    throw error;
  }
});

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

  // Check if the current user (admin) is active
  if (!req.user.is_active) {
    return res.status(403).json({
      success: false,
      error: "Your account has been deactivated. Please contact another administrator to reactivate your account.",
      code: "ACCOUNT_DEACTIVATED"
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

export const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  // Use the authenticated user's ID from the middleware
  const userId = req.user.id;

  // Check if the current user is active
  if (!req.user.is_active) {
    return res.status(403).json({
      success: false,
      error: "Your account has been deactivated. Please contact an administrator to reactivate your account.",
      code: "ACCOUNT_DEACTIVATED"
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

  try {
    const success = await changePassword(userId, currentPassword, newPassword);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Failed to change password"
      });
    }

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    // Handle specific password change errors
    if (error.message === "Current password is incorrect") {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect"
      });
    }

    if (error.message === "User account is inactive") {
      return res.status(403).json({
        success: false,
        error: "Your account has been deactivated. Please contact an administrator to reactivate your account.",
        code: "ACCOUNT_DEACTIVATED"
      });
    }

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    throw error;
  }
});

export const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (!req.user.is_active) {
    return res.status(403).json({
      success: false,
      error: "Your account has been deactivated. Please contact an administrator to reactivate your account.",
      code: "ACCOUNT_DEACTIVATED"
    });
  }

  const { role, ...allowedData } = req.body;

  if (role && req.user.role === "ADMIN" && req.body.targetUserId && req.body.targetUserId !== userId) {
  }

  const validation = validateData(updateProfileSchema, allowedData);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: validation.errors
    });
  }

  try {
    const updatedUser = await userService.updateUser(userId, validation.data);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    const formattedUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      role: updatedUser.role,
      isActive: updatedUser.is_active,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at
    };

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: formattedUser
    });
  } catch (error) {
    if (error.message === "Email already in use") {
      return res.status(400).json({
        success: false,
        error: "Email address is already in use"
      });
    }

    if (error.message === "Username already in use") {
      return res.status(400).json({
        success: false,
        error: "Username is already in use"
      });
    }

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    throw error;
  }
});

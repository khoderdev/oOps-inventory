import { User } from "../models/User.js";
import { comparePassword, hashPassword } from "../utils/auth.js";
import logger from "../utils/logger.js";

export const getUserById = async id => {
  try {
    const user = await User.findById(id);
    if (user) {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  } catch (error) {
    logger.error("Error getting user by ID:", error);
    throw new Error("Failed to retrieve user");
  }
};

export const getUserByEmail = async email => {
  try {
    return await User.findByEmail(email);
  } catch (error) {
    logger.error("Error getting user by email:", error);
    throw new Error("Failed to retrieve user");
  }
};

export const createUser = async userData => {
  const { email, password, firstName, lastName, role } = userData;
  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    const passwordHash = await hashPassword(password);
    const newUser = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role
    });
    logger.info(`User created successfully: ${newUser.email}`);
    return newUser;
  } catch (error) {
    logger.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (id, updateData) => {
  try {
    const existingUser = await User.findById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await User.findByEmail(updateData.email);
      if (emailExists) {
        throw new Error("Email already in use");
      }
    }
    if (updateData.password) {
      updateData.passwordHash = await hashPassword(updateData.password);
      delete updateData.password;
    }
    const updatedUser = await User.update(id, updateData);
    if (updatedUser) {
      logger.info(`User updated successfully: ${updatedUser.email}`);
    }
    return updatedUser;
  } catch (error) {
    logger.error("Error updating user:", error);
    throw error;
  }
};

export const updateUserRole = async (id, role) => {
  try {
    const existingUser = await User.findById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }
    const updatedUser = await User.update(id, { role });
    if (updatedUser) {
      logger.info(`User role updated successfully: ${updatedUser.email} -> ${role}`);
    }
    return updatedUser;
  } catch (error) {
    logger.error("Error updating user role:", error);
    throw error;
  }
};

export const deleteUser = async id => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    const deleted = await User.delete(id);
    if (deleted) {
      logger.info(`User deleted successfully: ${user.email}`);
    }
    return deleted;
  } catch (error) {
    logger.error("Error deleting user:", error);
    throw error;
  }
};

export const getAllUsers = async (options = {}) => {
  try {
    return await User.findAll(options);
  } catch (error) {
    logger.error("Error getting all users:", error);
    throw new Error("Failed to retrieve users");
  }
};

export const changePassword = async (id, currentPassword, newPassword) => {
  try {
    // Validate input parameters
    if (!id || !currentPassword || !newPassword) {
      throw new Error("Missing required parameters");
    }

    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long");
    }

    const user = await User.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user account is active
    if (!user.is_active) {
      throw new Error("User account is inactive");
    }

    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Don't allow changing to the same password
    const isSamePassword = await comparePassword(newPassword, user.password_hash);
    if (isSamePassword) {
      throw new Error("New password must be different from current password");
    }

    const newPasswordHash = await hashPassword(newPassword);
    const updated = await User.update(id, { passwordHash: newPasswordHash });

    if (updated) {
      logger.info(`Password changed successfully for user: ${user.email} (ID: ${id})`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Error changing password:", error);
    throw error;
  }
};

export const updateUserStatus = async (id, isActive) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = await User.update(id, { isActive });
    if (updatedUser) {
      logger.info(`User status updated: ${user.email} -> ${isActive ? "active" : "inactive"}`);
    }
    return updatedUser;
  } catch (error) {
    logger.error("Error updating user status:", error);
    throw error;
  }
};

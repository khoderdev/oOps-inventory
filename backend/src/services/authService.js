import { comparePassword, generateToken, verifyToken } from "../utils/auth.js";
import logger from "../utils/logger.js";
import { createUser, getUserByEmail, getUserById } from "./userService.js";

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - User object and token
 */
export const registerUser = async userData => {
  try {
    // Handle name field - split into firstName and lastName if provided as single field
    let processedUserData = { ...userData };

    if (userData.name && !userData.firstName && !userData.lastName) {
      const nameParts = userData.name.trim().split(" ");
      processedUserData.firstName = nameParts[0] || "";
      processedUserData.lastName = nameParts.slice(1).join(" ") || nameParts[0] || "User";
      delete processedUserData.name; // Remove the original name field
    }

    // Create user
    const newUser = await createUser(processedUserData);

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    logger.info(`User registered successfully: ${newUser.email}`);

    return {
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        isActive: newUser.is_active,
        createdAt: newUser.created_at
      },
      token
    };
  } catch (error) {
    logger.error("Registration error:", error);
    throw error;
  }
};

/**
 * Authenticate user login
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - User object and token
 */
export const loginUser = async (email, password) => {
  try {
    // Find user by email
    const user = await getUserByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error("Account is inactive. Please contact administrator.");
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    logger.info(`User logged in successfully: ${user.email}`);

    return {
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      token
    };
  } catch (error) {
    logger.error("Login error:", error);
    throw error;
  }
};

/**
 * Validate user token and return user info
 * @param {string} token - JWT token
 * @returns {Promise<Object>} - User object
 */
export const validateToken = async token => {
  try {
    const decoded = verifyToken(token);

    // Get fresh user data from database
    const user = await getUserById(decoded.id);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.is_active) {
      throw new Error("User account is inactive");
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    };
  } catch (error) {
    logger.error("Token validation error:", error);
    throw error;
  }
};

/**
 * Refresh user token
 * @param {Object} user - User object from middleware
 * @returns {Promise<Object>} - New token
 */
export const refreshToken = async user => {
  try {
    // Generate new JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    logger.info(`Token refreshed for user: ${user.email}`);

    return {
      success: true,
      message: "Token refreshed successfully",
      token
    };
  } catch (error) {
    logger.error("Token refresh error:", error);
    throw error;
  }
};

/**
 * Logout user (token blacklisting could be implemented here)
 * @param {Object} user - User object from middleware
 * @returns {Promise<Object>} - Logout confirmation
 */
export const logoutUser = async user => {
  try {
    // In a production environment, you might want to:
    // 1. Add token to blacklist
    // 2. Store token in Redis with expiration
    // 3. Invalidate refresh tokens

    logger.info(`User logged out: ${user.email}`);

    return {
      success: true,
      message: "Logout successful"
    };
  } catch (error) {
    logger.error("Logout error:", error);
    throw error;
  }
};

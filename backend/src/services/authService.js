import { comparePassword, generateToken, verifyToken } from "../utils/auth.js";
import logger from "../utils/logger.js";
import { createUser, getUserById, getUserByUsername } from "./userService.js";

export const registerUser = async userData => {
  try {
    let processedUserData = { ...userData };

    if (userData.name && !userData.firstName && !userData.lastName) {
      const nameParts = userData.name.trim().split(" ");
      processedUserData.firstName = nameParts[0] || "";
      processedUserData.lastName = nameParts.slice(1).join(" ") || "";
      delete processedUserData.name;
    }

    if (processedUserData.firstName === "") {
      processedUserData.firstName = null;
    }
    if (processedUserData.lastName === "") {
      processedUserData.lastName = null;
    }
    if (processedUserData.email === "") {
      processedUserData.email = null;
    }

    const newUser = await createUser(processedUserData);

    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role
    });

    logger.info(`User registered successfully: ${newUser.username}`);

    return {
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
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

export const loginUser = async (username, password) => {
  try {
    const user = await getUserByUsername(username);
    if (!user) {
      throw new Error("Invalid username or password");
    }

    if (!user.is_active) {
      const error = new Error("Your account has been deactivated. Please contact an administrator to reactivate your account.");
      error.code = "ACCOUNT_DEACTIVATED";
      throw error;
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error("Invalid username or password");
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    logger.info(`User logged in successfully: ${user.username}`);

    return {
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
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

export const validateToken = async token => {
  try {
    const decoded = verifyToken(token);
    const user = await getUserById(decoded.id);
    if (!user) {
      throw new Error("User not found");
    }
    if (!user.is_active) {
      const error = new Error("Your account has been deactivated. Please contact an administrator to reactivate your account.");
      error.code = "ACCOUNT_DEACTIVATED";
      throw error;
    }
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
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

export const refreshToken = async user => {
  try {
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    logger.info(`Token refreshed for user: ${user.username}`);

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

export const logoutUser = async user => {
  try {
    // In a production environment, you might want to:
    // 1. Add token to blacklist
    // 2. Store token in Redis with expiration
    // 3. Invalidate refresh tokens

    logger.info(`User logged out: ${user.username}`);

    return {
      success: true,
      message: "Logout successful"
    };
  } catch (error) {
    logger.error("Logout error:", error);
    throw error;
  }
};

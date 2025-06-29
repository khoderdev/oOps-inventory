import { getUserById } from "../services/userService.js";
import { extractToken, verifyToken } from "../utils/auth.js";
import logger from "../utils/logger.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided."
      });
    }

    const decoded = verifyToken(token);

    const user = await getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Access denied. User not found."
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: "Access denied. User account is inactive."
      });
    }

    // Add user to request object (exclude password hash)
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    next();
  } catch (error) {
    logger.error("Authentication error:", error);

    if (error.message === "Token has expired") {
      return res.status(401).json({
        success: false,
        error: "Access denied. Token has expired."
      });
    }

    if (error.message === "Invalid token") {
      return res.status(401).json({
        success: false,
        error: "Access denied. Invalid token."
      });
    }

    return res.status(500).json({
      success: false,
      error: "Authentication failed. Please try again."
    });
  }
};

/**
 * Optional authentication middleware
 * Similar to authenticate but doesn't fail if no token is provided
 * Useful for endpoints that work for both authenticated and non-authenticated users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      // No token provided, continue without user info
      return next();
    }
    // Verify the token
    const decoded = verifyToken(token);
    // Get user from database
    const user = await getUserById(decoded.id);
    if (user && user.is_active) {
      // Add user to request object (exclude password hash)
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    }
    next();
  } catch (error) {
    logger.warn("Optional authentication failed:", error.message);
    next();
  }
};

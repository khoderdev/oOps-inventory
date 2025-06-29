import logger from "../utils/logger.js";

const ROLES = {
  admin: 3,
  manager: 2,
  employee: 1,
};

/**
 * Check if a user has a specific role
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Required role
 * @returns {boolean} - True if user has required role or higher
 */
export const hasRole = (userRole, requiredRole) => {
  const userRoleLevel = ROLES[userRole] || 0;
  const requiredRoleLevel = ROLES[requiredRole] || 0;
  return userRoleLevel >= requiredRoleLevel;
};

/**
 * Middleware to require specific roles
 * @param {...string} roles - Required roles
 * @returns {Function} - Express middleware function
 */
export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }
    const userRole = req.user.role;
    const hasRequiredRole = roles.some((role) => hasRole(userRole, role));

    if (!hasRequiredRole) {
      logger.warn(
        `Access denied for user ${
          req.user.id
        } with role ${userRole}. Required roles: ${roles.join(", ")}`
      );
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions. Required role: " + roles.join(" or "),
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRoles("admin");

/**
 * Middleware to check if user is manager or above
 */
export const requireManager = requireRoles("manager", "admin");

/**
 * Middleware to check if user can access own resource or is admin/manager
 * @param {string} userIdParam - Parameter name containing user ID (default: 'id')
 * @returns {Function} - Express middleware function
 */
export const requireOwnershipOrRole = (userIdParam = "id") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const userRole = req.user.role;
    const requestedUserId = parseInt(req.params[userIdParam]);
    const currentUserId = req.user.id;

    // Admin and manager can access any user's resource
    if (hasRole(userRole, "manager")) {
      return next();
    }

    // User can only access their own resource
    if (currentUserId === requestedUserId) {
      return next();
    }

    logger.warn(
      `Access denied for user ${currentUserId} trying to access user ${requestedUserId}'s resource`
    );
    return res.status(403).json({
      success: false,
      error: "Access denied. You can only access your own resources.",
    });
  };
};

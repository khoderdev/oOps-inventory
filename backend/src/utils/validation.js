import Joi from "joi";

/**
 * User registration validation schema
 */
export const registerSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username must not exceed 50 characters",
      "string.pattern.base": "Username can only contain letters, numbers, and underscores",
      "any.required": "Username is required"
    }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .optional()
    .allow("")
    .messages({
      "string.email": "Please provide a valid email address"
    }),

  password: Joi.string().min(6).max(128).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "string.max": "Password must not exceed 128 characters",
    "any.required": "Password is required"
  }),

  // Allow either a single name field OR firstName/lastName fields
  name: Joi.string().trim().min(1).max(200).optional().allow("").messages({
    "string.min": "Name cannot be empty if provided",
    "string.max": "Name must not exceed 200 characters"
  }),

  firstName: Joi.string().trim().max(100).optional().allow("").messages({
    "string.max": "First name must not exceed 100 characters"
  }),

  lastName: Joi.string().trim().max(100).optional().allow("").messages({
    "string.max": "Last name must not exceed 100 characters"
  }),

  role: Joi.string().valid("ADMIN", "MANAGER", "STAFF").default("STAFF").messages({
    "any.only": "Role must be one of: ADMIN, MANAGER, STAFF"
  })
});

/**
 * User login validation schema
 */
export const loginSchema = Joi.object({
  username: Joi.string().trim().required().messages({
    "any.required": "Username is required"
  }),

  password: Joi.string().required().messages({
    "any.required": "Password is required"
  })
});

/**
 * Update user role validation schema
 */
export const updateRoleSchema = Joi.object({
  role: Joi.string().valid("ADMIN", "MANAGER", "STAFF").required().messages({
    "any.only": "Role must be one of: ADMIN, MANAGER, STAFF",
    "any.required": "Role is required"
  })
});

/**
 * Update user profile validation schema
 */
export const updateProfileSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .optional()
    .messages({
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username must not exceed 50 characters",
      "string.pattern.base": "Username can only contain letters, numbers, and underscores"
    }),

  firstName: Joi.string().trim().max(100).optional().allow("").messages({
    "string.max": "First name must not exceed 100 characters"
  }),

  lastName: Joi.string().trim().max(100).optional().allow("").messages({
    "string.max": "Last name must not exceed 100 characters"
  }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .optional()
    .allow("")
    .messages({
      "string.email": "Please provide a valid email address"
    }),

  // Role is optional and typically handled by admin-only endpoints
  role: Joi.string().valid("ADMIN", "MANAGER", "STAFF").optional().messages({
    "any.only": "Role must be one of: ADMIN, MANAGER, STAFF"
  })
});

/**
 * Change password validation schema
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required"
  }),

  newPassword: Joi.string().min(6).max(128).required().messages({
    "string.min": "New password must be at least 6 characters long",
    "string.max": "New password must not exceed 128 characters",
    "any.required": "New password is required"
  })
});

/**
 * Validate request data against a schema
 * @param {Object} schema - Joi validation schema
 * @param {Object} data - Data to validate
 * @returns {Object} - Validation result
 */
export const validateData = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join("."),
      message: detail.message
    }));

    return {
      isValid: false,
      errors,
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
};

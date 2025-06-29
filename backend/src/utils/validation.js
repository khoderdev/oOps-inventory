/**
 * Validation schemas using Joi
 * Provides input validation for API endpoints
 */

import Joi from 'joi';

/**
 * User registration validation schema
 */
export const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),
  
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name must not exceed 100 characters',
      'any.required': 'First name is required',
    }),
  
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must not exceed 100 characters',
      'any.required': 'Last name is required',
    }),
  
  role: Joi.string()
    .valid('admin', 'manager', 'employee')
    .default('employee')
    .messages({
      'any.only': 'Role must be one of: admin, manager, employee',
    }),
});

/**
 * User login validation schema
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

/**
 * Update user role validation schema
 */
export const updateRoleSchema = Joi.object({
  role: Joi.string()
    .valid('admin', 'manager', 'employee')
    .required()
    .messages({
      'any.only': 'Role must be one of: admin, manager, employee',
      'any.required': 'Role is required',
    }),
});

/**
 * Update user profile validation schema
 */
export const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name must not exceed 100 characters',
    }),
  
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name must not exceed 100 characters',
    }),
  
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Change password validation schema
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required',
    }),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password must not exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'New password is required',
    }),
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
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    
    return {
      isValid: false,
      errors,
      data: null,
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value,
  };
}; 
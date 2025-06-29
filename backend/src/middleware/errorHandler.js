/**
 * Global error handler middleware
 * Handles different types of errors and provides appropriate responses
 */

import logger from '../utils/logger.js';

/**
 * Global error handler middleware
 * Must be used as the last middleware in the application
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(`Error in ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        error = {
          message: 'Resource already exists',
          statusCode: 409,
        };
        break;
      case '23503': // Foreign key violation
        error = {
          message: 'Referenced resource does not exist',
          statusCode: 400,
        };
        break;
      case '23502': // Not null violation
        error = {
          message: 'Required field is missing',
          statusCode: 400,
        };
        break;
      case '42P01': // Undefined table
        error = {
          message: 'Database configuration error',
          statusCode: 500,
        };
        break;
      default:
        error = {
          message: 'Database error occurred',
          statusCode: 500,
        };
    }
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  // Don't send stack trace in production
  const response = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

/**
 * Handle 404 routes
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}; 
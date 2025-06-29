/**
 * Authentication utilities
 * Handles password hashing and JWT token operations
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from './logger.js';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password) => {
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare a password with its hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - True if passwords match
 */
export const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    logger.error('Error comparing passwords:', error);
    throw new Error('Failed to compare passwords');
  }
};

/**
 * Generate a JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration time
 * @returns {string} - JWT token
 */
export const generateToken = (payload, expiresIn = null) => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const options = {};
    if (expiresIn) {
      options.expiresIn = expiresIn;
    } else {
      options.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    }

    const token = jwt.sign(payload, jwtSecret, options);
    return token;
  } catch (error) {
    logger.error('Error generating token:', error);
    throw new Error('Failed to generate token');
  }
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      logger.error('Error verifying token:', error);
      throw new Error('Failed to verify token');
    }
  }
};

/**
 * Extract token from authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Extracted token or null
 */
export const extractToken = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}; 
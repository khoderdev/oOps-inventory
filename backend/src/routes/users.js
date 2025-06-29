import express from 'express';
import {
  getUsers,
  getUser,
  updateProfile,
  updateRole,
  deleteUserById,
  changeUserPassword,
  updateStatus,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin, requireOwnershipOrRole } from '../middleware/rbac.js';

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin/Manager only)
 */
router.get('/', authenticate, requireAdmin, getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin/Manager or own profile)
 */
router.get('/:id', authenticate, requireOwnershipOrRole('id'), getUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (Admin/Manager or own profile)
 */
router.put('/:id', authenticate, requireOwnershipOrRole('id'), updateProfile);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin only)
 */
router.put('/:id/role', authenticate, requireAdmin, updateRole);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, deleteUserById);

/**
 * @route   POST /api/users/:id/change-password
 * @desc    Change user password
 * @access  Private (Own profile only)
 */
router.post('/:id/change-password', authenticate, requireOwnershipOrRole('id'), changeUserPassword);

/**
 * @route   PUT /api/users/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private (Admin only)
 */
router.put('/:id/status', authenticate, requireAdmin, updateStatus);

export default router; 
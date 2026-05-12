import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';

const router = Router();

// Shorthand — all admin routes require auth + admin role
const guard = [authenticate, requireAdmin];

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get system overview stats (Dashboard)
 * @access  Private (Admin)
 */
router.get('/dashboard', ...guard, adminController.getDashboardStats);

/**
 * @route   GET /api/admin/profile
 * @desc    Get admin profile
 * @access  Private (Admin)
 */
router.get('/profile', ...guard, adminController.getProfile);

/**
 * @route   PATCH /api/admin/profile
 * @desc    Update admin profile
 * @access  Private (Admin)
 */
router.patch('/profile', ...guard, adminController.updateProfile);

/** 
 * --- User Management ---
 */

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and search
 * @access  Private (Admin)
 */
router.get('/users', ...guard, adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/free
 * @desc    Get all free (non-paid) users with pagination and search
 * @access  Private (Admin)
 * ⚠️  Must be defined BEFORE /users/:userId to avoid "free" being treated as an ObjectId
 */
router.get('/users/free', ...guard, adminController.getFreeUsers);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get detailed user information
 * @access  Private (Admin)
 */
router.get('/users/:userId', ...guard, adminController.getUserDetails);

/**
 * @route   GET /api/admin/users/:userId/assessments
 * @desc    Get all assessment results (PHQ-9, GAD-7, DES-11) for a specific user
 * @access  Private (Admin)
 */
router.get('/users/:userId/assessments', ...guard, adminController.getUserAssessments);

/**
 * @route   PATCH /api/admin/users/:userId/status
 * @desc    Activate or Suspend user
 * @access  Private (Admin)
 */
router.patch('/users/:userId/status', ...guard, adminController.updateUserStatus);

export default router;

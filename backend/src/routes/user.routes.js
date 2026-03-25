/**
 * User Routes
 * 
 * This file defines all API endpoints related to user management.
 * Routes are organized by access level:
 * - Public: Registration and login
 * - Protected: User profile management
 * - Admin: User administration
 */

const express = require("express");
const router = express.Router();

// Import controllers
const userController = require("../controllers/user.controller");

// Import middleware
const { protect, adminOnly } = require("../middleware/auth.middleware");

// Import multer configuration for avatar uploads
const { uploadAvatar } = require("../config/multer.config");

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * POST /api/users/register
 * Register a new user (student by default)
 * Body: { name, email, password, role }
 */
router.post("/register", userController.register);

/**
 * POST /api/users/login
 * Login existing user
 * Body: { email, password }
 */
router.post("/login", userController.login);

/**
 * POST /api/users/create
 * Create a new user (alternative endpoint)
 * Body: { name, email, password, role }
 */
router.post("/create", userController.createUser);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * POST /api/users/logout
 * Logout user (client-side token removal)
 * Note: For JWT, actual logout is done on client by removing token
 */
router.post("/logout", protect, userController.logout);

/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get("/profile", protect, userController.getProfile);

/**
 * PUT /api/users/profile
 * Update current user's profile (text fields only)
 * Body: { name, phone, address }
 */
router.put("/profile", protect, userController.updateProfile);

/**
 * PATCH /api/users/avatar
 * Update user's avatar/profile picture
 * Content-Type: multipart/form-data
 * Field name: 'avatar'
 * 
 * This route uses multer middleware to handle file upload:
 * - uploadAvatar.single('avatar') processes a single file from the 'avatar' field
 * - File is validated (type, size) and saved to uploads/avatars directory
 * - File info is available in req.file after upload
 */
router.patch(
  "/avatar",
  protect,
  uploadAvatar.single("avatar"), // Multer middleware for single file upload
  userController.updateAvatar
);

/**
 * DELETE /api/users/avatar
 * Remove user's avatar (reset to default)
 */
router.delete("/avatar", protect, userController.deleteAvatar);

/**
 * POST /api/users/change-password
 * Change user's password
 * Body: { currentPassword, newPassword }
 */
router.post("/change-password", protect, userController.changePassword);

// ============================================
// ADMIN ROUTES (Admin authentication required)
// ============================================

/**
 * GET /api/users
 * Get all users with pagination
 * Query params: page, limit, includeInactive
 */
router.get("/", protect, adminOnly, userController.getAllUsers);

/**
 * GET /api/users/:id
 * Get specific user by ID
 */
router.get("/:id", protect, adminOnly, userController.getUserById);

/**
 * DELETE /api/users/:id
 * Deactivate (soft delete) a user
 * Note: User is not actually deleted, just marked as inactive
 */
router.delete("/:id", protect, adminOnly, userController.deactivateUser);

// Export router for use in app.js
module.exports = router;
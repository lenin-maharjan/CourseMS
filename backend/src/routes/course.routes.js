/**
 * Course Routes
 * 
 * This file defines all API endpoints related to courses.
 * Routes are organized by functionality and protected with appropriate middleware.
 * 
 * Authentication Levels:
 * - Public: Anyone can access
 * - Authenticated: Only logged-in users
 * - Teacher/Admin: Only teachers and admins
 * - Owner/Admin: Only course instructor or admin
 */

const express = require("express");
const router = express.Router();

// Import controllers
const courseController = require("../controllers/course.controller");

// Import middleware
const { protect, teacherOnly, adminOnly } = require("../middleware/auth.middleware");
const { uploadCourseImage } = require("../config/multer.config");

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * GET /api/courses
 * Get all courses with pagination, filtering, and search
 * Query params: page, limit, category, level, priceType, search, sortBy
 */
router.get("/", courseController.getAllCourses);

/**
 * GET /api/courses/my-enrollments
 * Get current user's enrolled courses
 * Put this before /:id to prevent "my-enrollments" from being interpreted as an ID
 */
router.get("/my-enrollments", protect, courseController.getMyEnrollments);

/**
 * GET /api/courses/:id
 * Get a single course by ID
 */
router.get("/:id", courseController.getCourseById);

/**
 * GET /api/courses/instructor/:instructorId
 * Get all courses by a specific instructor
 */
router.get("/instructor/:instructorId", courseController.getCoursesByInstructor);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * POST /api/courses/:id/enroll
 * Enroll student in a course
 */
router.post("/:id/enroll", protect, courseController.enrollInCourse);

/**
 * POST /api/courses
 * Create a new course
 * Required role: teacher or admin
 */
router.post("/", protect, teacherOnly, courseController.createCourse);

/**
 * PUT /api/courses/:id
 * Update course details
 * Required: Course owner or admin
 */
router.put("/:id", protect, courseController.updateCourse);

/**
 * DELETE /api/courses/:id
 * Delete a course
 * Required: Course owner or admin
 */
router.delete("/:id", protect, courseController.deleteCourse);

/**
 * PATCH /api/courses/:id/thumbnail
 * Update course thumbnail/image
 * Required: Course owner or admin
 * Content-Type: multipart/form-data
 * Field name: 'thumbnail'
 */
router.patch(
  "/:id/thumbnail",
  protect,
  uploadCourseImage.single("thumbnail"), // Multer middleware for single file upload
  courseController.updateCourseThumbnail
);

// ============================================
// LESSON ROUTES (Nested under courses)
// ============================================

/**
 * POST /api/courses/:id/lessons
 * Add a new lesson to a course
 * Required: Course owner or admin
 */
router.post("/:id/lessons", protect, courseController.addLesson);

/**
 * PUT /api/courses/:id/lessons/:lessonId
 * Update a specific lesson
 * Required: Course owner or admin
 */
router.put("/:id/lessons/:lessonId", protect, courseController.updateLesson);

/**
 * DELETE /api/courses/:id/lessons/:lessonId
 * Delete a specific lesson
 * Required: Course owner or admin
 */
router.delete("/:id/lessons/:lessonId", protect, courseController.deleteLesson);

// Export router for use in app.js
module.exports = router;
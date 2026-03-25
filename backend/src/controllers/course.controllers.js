/**
 * Course Controller
 * 
 * This controller handles HTTP requests related to courses.
 * It receives requests from routes, validates input, calls services,
 * and returns appropriate HTTP responses.
 * 
 * Each controller function:
 * 1. Validates request data
 * 2. Calls the appropriate service function
 * 3. Returns success response or handles errors
 */

const courseService = require("../services/course.service");
const { NODE_ENV } = require("../config/config");

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate course creation/update data
 * @param {Object} data - Request body data
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Array} Array of error messages
 */
const validateCourseData = (data, isUpdate = false) => {
  const errors = [];

  // Title validation (required for create, optional for update)
  if (!isUpdate || data.title !== undefined) {
    if (!data.title || data.title.trim() === "") {
      errors.push("Course title is required");
    } else if (data.title.length > 100) {
      errors.push("Course title cannot be more than 100 characters");
    }
  }

  // Description validation
  if (!isUpdate || data.description !== undefined) {
    if (!data.description || data.description.trim() === "") {
      errors.push("Course description is required");
    } else if (data.description.length > 2000) {
      errors.push("Description cannot be more than 2000 characters");
    }
  }

  // Category validation
  if (!isUpdate || data.category !== undefined) {
    if (!data.category || data.category.trim() === "") {
      errors.push("Course category is required");
    }
  }

  // Price validation
  if (data.price !== undefined) {
    if (typeof data.price !== "number" || data.price < 0) {
      errors.push("Price must be a positive number");
    }
  }

  // Level validation
  if (data.level !== undefined) {
    const validLevels = ["beginner", "intermediate", "advanced"];
    if (!validLevels.includes(data.level)) {
      errors.push(`Level must be one of: ${validLevels.join(", ")}`);
    }
  }

  // Status validation
  if (data.status !== undefined) {
    const validStatuses = ["draft", "published", "archived"];
    if (!validStatuses.includes(data.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(", ")}`);
    }
  }

  return errors;
};

/**
 * Validate lesson data
 * @param {Object} data - Lesson data
 * @returns {Array} Array of error messages
 */
const validateLessonData = (data) => {
  const errors = [];

  if (!data.title || data.title.trim() === "") {
    errors.push("Lesson title is required");
  } else if (data.title.length > 100) {
    errors.push("Lesson title cannot be more than 100 characters");
  }

  if (data.duration !== undefined) {
    if (typeof data.duration !== "number" || data.duration < 0) {
      errors.push("Duration must be a positive number (in minutes)");
    }
  }

  return errors;
};

// ============================================
// ERROR HANDLER
// ============================================

/**
 * Centralized error handler
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 */
const handleError = (res, error) => {
  console.error("Course Controller Error:", error.message);
  
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || "Internal server error",
  };

  // Include stack trace in development mode
  if (NODE_ENV === "development") {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// ============================================
// COURSE CONTROLLERS
// ============================================

/**
 * Get all courses
 * Supports filtering, pagination, and search
 */
const getAllCourses = async (req, res) => {
  try {
    // Build options from query parameters
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      category: req.query.category,
      level: req.query.level,
      priceType: req.query.priceType, // 'free' or 'paid'
      search: req.query.search,
      status: req.query.status,
      includeDrafts: req.query.includeDrafts === "true" && req.user?.role === "admin",
      sortBy: req.query.sortBy,
    };

    const result = await courseService.getAllCourses(options);
    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Get a single course by ID
 */
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await courseService.getCourseById(id);
    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Create a new course
 * Only teachers and admins can create courses
 */
const createCourse = async (req, res) => {
  try {
    // Validate input data
    const errors = validateCourseData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Get instructor ID from authenticated user
    const instructorId = req.user.id;

    const result = await courseService.createCourse(req.body, instructorId);
    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Update a course
 * Only the course instructor or admin can update
 */
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input data
    const errors = validateCourseData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const result = await courseService.updateCourse(
      id,
      req.body,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Delete a course
 * Only the course instructor or admin can delete
 */
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await courseService.deleteCourse(
      id,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Update course thumbnail/image
 * Handles file upload via multer middleware
 */
const updateCourseThumbnail = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    const result = await courseService.updateCourseThumbnail(
      id,
      req.file,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Get courses by instructor
 */
const getCoursesByInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    };

    const result = await courseService.getCoursesByInstructor(instructorId, options);
    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// ============================================
// LESSON CONTROLLERS
// ============================================

/**
 * Add a lesson to a course
 */
const addLesson = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate lesson data
    const errors = validateLessonData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const result = await courseService.addLesson(
      id,
      req.body,
      req.user.id,
      req.user.role
    );

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Update a lesson
 */
const updateLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;

    // Validate lesson data
    const errors = validateLessonData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const result = await courseService.updateLesson(
      id,
      lessonId,
      req.body,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Delete a lesson
 */
const deleteLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;

    const result = await courseService.deleteLesson(
      id,
      lessonId,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Enroll in a course
 */
const enrollInCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await courseService.enrollInCourse(id, req.user.id);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Get your enrolled courses
 */
const getMyEnrollments = async (req, res) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await courseService.getMyEnrollments(req.user.id, options);

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// ============================================
// EXPORT ALL CONTROLLERS
// ============================================

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseThumbnail,
  getCoursesByInstructor,
  addLesson,
  updateLesson,
  deleteLesson,
  enrollInCourse,
  getMyEnrollments,
};
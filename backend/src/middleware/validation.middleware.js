/**
 * Validation Middleware
 * 
 * This file contains reusable validation middleware functions.
 * These functions validate request data before it reaches the controllers.
 * 
 * Using middleware for validation keeps controllers clean and focused
 * on business logic rather than input validation.
 */

/**
 * Validates course creation/update data
 * Checks required fields and data types
 */
const validateCourse = (req, res, next) => {
  const errors = [];
  const { title, description, category, price, level, status } = req.body;

  // Check if creating new course (POST request) - all required fields must be present
  const isCreating = req.method === "POST";

  // Title validation
  if (isCreating || title !== undefined) {
    if (!title || title.trim() === "") {
      errors.push("Course title is required");
    } else if (title.length > 100) {
      errors.push("Course title cannot be more than 100 characters");
    }
  }

  // Description validation
  if (isCreating || description !== undefined) {
    if (!description || description.trim() === "") {
      errors.push("Course description is required");
    } else if (description.length > 2000) {
      errors.push("Description cannot be more than 2000 characters");
    }
  }

  // Category validation
  if (isCreating || category !== undefined) {
    if (!category || category.trim() === "") {
      errors.push("Course category is required");
    }
  }

  // Price validation
  if (price !== undefined) {
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.push("Price must be a positive number");
    }
  }

  // Level validation
  if (level !== undefined) {
    const validLevels = ["beginner", "intermediate", "advanced"];
    if (!validLevels.includes(level)) {
      errors.push(`Level must be one of: ${validLevels.join(", ")}`);
    }
  }

  // Status validation
  if (status !== undefined) {
    const validStatuses = ["draft", "published", "archived"];
    if (!validStatuses.includes(status)) {
      errors.push(`Status must be one of: ${validStatuses.join(", ")}`);
    }
  }

  // If there are errors, return 400 response
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // If no errors, proceed to next middleware/controller
  next();
};

/**
 * Validates lesson data
 * Ensures lessons have required fields before adding to course
 */
const validateLesson = (req, res, next) => {
  const errors = [];
  const { title, description, duration, order } = req.body;

  // Title validation
  if (!title || title.trim() === "") {
    errors.push("Lesson title is required");
  } else if (title.length > 100) {
    errors.push("Lesson title cannot be more than 100 characters");
  }

  // Description validation (optional but limited if provided)
  if (description !== undefined && description.length > 500) {
    errors.push("Lesson description cannot be more than 500 characters");
  }

  // Duration validation (optional but must be positive number)
  if (duration !== undefined) {
    const durationNum = Number(duration);
    if (isNaN(durationNum) || durationNum < 0) {
      errors.push("Duration must be a positive number (in minutes)");
    }
  }

  // Order validation (optional but must be positive integer)
  if (order !== undefined) {
    const orderNum = Number(order);
    if (isNaN(orderNum) || !Number.isInteger(orderNum) || orderNum < 0) {
      errors.push("Order must be a positive integer");
    }
  }

  // If there are errors, return 400 response
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

/**
 * Validates pagination parameters
 * Ensures page and limit are valid numbers
 */
const validatePagination = (req, res, next) => {
  const errors = [];
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = Number(page);
    if (isNaN(pageNum) || !Number.isInteger(pageNum) || pageNum < 1) {
      errors.push("Page must be a positive integer");
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (isNaN(limitNum) || !Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push("Limit must be a positive integer between 1 and 100");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid pagination parameters",
      errors,
    });
  }

  next();
};

/**
 * Validates file upload
 * Ensures a file was actually uploaded
 * This middleware should be used AFTER multer middleware
 */
const validateFileUpload = (fieldName) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: `Please upload a file in the '${fieldName}' field`,
      });
    }

    // Log file info for debugging (optional)
    console.log("File uploaded:", {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    next();
  };
};

/**
 * Validates MongoDB ObjectId format
 * Prevents errors from invalid ID formats
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const mongoose = require("mongoose");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }

    next();
  };
};

// Export all validation middleware
module.exports = {
  validateCourse,
  validateLesson,
  validatePagination,
  validateFileUpload,
  validateObjectId,
};
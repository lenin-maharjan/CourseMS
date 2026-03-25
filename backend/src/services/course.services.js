/**
 * Course Service
 * 
 * This service handles all business logic related to courses.
 * It communicates with the Course model and handles CRUD operations.
 * 
 * Each function follows this pattern:
 * 1. Validate input data
 * 2. Perform database operations
 * 3. Return formatted response
 * 4. Handle errors gracefully
 */

const Course = require("../models/course.model");
const User = require("../models/user.models");
const Enrollment = require("../models/enrollment.model");
const { deleteOldFile, getFileUrl } = require("../config/multer.config");

/**
 * Get all courses with pagination and filtering
 * @param {Object} options - Query options (page, limit, filters)
 * @returns {Object} Paginated list of courses
 */
const getAllCourses = async (options = {}) => {
  try {
    // Set default pagination values
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    
    // Only show published courses by default (unless specified)
    if (options.status) {
      filter.status = options.status;
    } else if (!options.includeDrafts) {
      filter.status = "published";
    }

    // Filter by category
    if (options.category) {
      filter.category = options.category;
    }

    // Filter by level
    if (options.level) {
      filter.level = options.level;
    }

    // Filter by price (free or paid)
    if (options.priceType === "free") {
      filter.price = 0;
    } else if (options.priceType === "paid") {
      filter.price = { $gt: 0 };
    }

    // Search by keyword (title, description, or tags)
    if (options.search) {
      filter.$text = { $search: options.search };
    }

    // Filter by instructor
    if (options.instructor) {
      filter.instructor = options.instructor;
    }

    // Execute query with pagination
    const courses = await Course.find(filter)
      .populate("instructor", "name email avatar") // Include instructor details
      .skip(skip)
      .limit(limit)
      .sort(options.sortBy || { createdAt: -1 });

    // Get total count for pagination
    const total = await Course.countDocuments(filter);

    return {
      success: true,
      data: {
        courses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error in getAllCourses:", error.message);
    throw error;
  }
};

/**
 * Get a single course by ID
 * @param {string} courseId - Course ID
 * @returns {Object} Course details
 */
const getCourseById = async (courseId) => {
  try {
    const course = await Course.findById(courseId)
      .populate("instructor", "name email avatar phone");

    if (!course) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      success: true,
      data: { course },
    };
  } catch (error) {
    console.error("Error in getCourseById:", error.message);
    throw error;
  }
};

/**
 * Create a new course
 * @param {Object} courseData - Course data from request
 * @param {string} instructorId - ID of the instructor creating the course
 * @returns {Object} Created course
 */
const createCourse = async (courseData, instructorId) => {
  try {
    // Verify instructor exists
    const instructor = await User.findById(instructorId);
    if (!instructor) {
      const error = new Error("Instructor not found");
      error.statusCode = 404;
      throw error;
    }

    // Create course object
    const course = new Course({
      ...courseData,
      instructor: instructorId,
    });

    // Save to database
    await course.save();

    // Populate instructor details before returning
    const populatedCourse = await Course.findById(course._id).populate("instructor", "name email avatar");

    return {
      success: true,
      message: "Course created successfully",
      data: { course: populatedCourse },
    };
  } catch (error) {
    console.error("Error in createCourse:", error.message, error.stack);
    throw error;
  }
};

/**
 * Update a course
 * @param {string} courseId - Course ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user making the request (for authorization)
 * @param {string} userRole - Role of user making the request
 * @returns {Object} Updated course
 */
const updateCourse = async (courseId, updateData, userId, userRole) => {
  try {
    // Find the course
    const course = await Course.findById(courseId);

    if (!course) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    // Check authorization: Only instructor who created the course or admin can update
    if (course.instructor.toString() !== userId && userRole !== "admin") {
      const error = new Error("You are not authorized to update this course");
      error.statusCode = 403;
      throw error;
    }

    // Fields that are not allowed to be updated directly
    const restrictedFields = ["_id", "instructor", "enrolledStudents", "averageRating", "totalReviews"];
    restrictedFields.forEach((field) => {
      delete updateData[field];
    });

    // Update the course
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        course[key] = updateData[key];
      }
    });

    await course.save();
    await course.populate("instructor", "name email avatar");

    return {
      success: true,
      message: "Course updated successfully",
      data: { course },
    };
  } catch (error) {
    console.error("Error in updateCourse:", error.message);
    throw error;
  }
};

/**
 * Delete a course
 * @param {string} courseId - Course ID
 * @param {string} userId - ID of user making the request
 * @param {string} userRole - Role of user making the request
 * @returns {Object} Success message
 */
const deleteCourse = async (courseId, userId, userRole) => {
  try {
    const course = await Course.findById(courseId);

    if (!course) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    // Check authorization
    if (course.instructor.toString() !== userId && userRole !== "admin") {
      const error = new Error("You are not authorized to delete this course");
      error.statusCode = 403;
      throw error;
    }

    // Delete course thumbnail if exists
    if (course.thumbnail) {
      const filename = course.thumbnail.split("/").pop();
      deleteOldFile(filename, "course");
    }

    // Delete the course
    await Course.findByIdAndDelete(courseId);

    return {
      success: true,
      message: "Course deleted successfully",
    };
  } catch (error) {
    console.error("Error in deleteCourse:", error.message);
    throw error;
  }
};

/**
 * Update course thumbnail
 * @param {string} courseId - Course ID
 * @param {Object} file - Uploaded file object from multer
 * @param {string} userId - ID of user making the request
 * @param {string} userRole - Role of user making the request
 * @returns {Object} Updated course with new thumbnail URL
 */
const updateCourseThumbnail = async (courseId, file, userId, userRole) => {
  try {
    const course = await Course.findById(courseId);

    if (!course) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    // Check authorization
    if (course.instructor.toString() !== userId && userRole !== "admin") {
      const error = new Error("You are not authorized to update this course");
      error.statusCode = 403;
      throw error;
    }

    // Delete old thumbnail if exists
    if (course.thumbnail) {
      const oldFilename = course.thumbnail.split("/").pop();
      deleteOldFile(oldFilename, "course");
    }

    // Update with new thumbnail
    const thumbnailUrl = getFileUrl(file.filename, "course");
    course.thumbnail = thumbnailUrl;
    await course.save();

    return {
      success: true,
      message: "Course thumbnail updated successfully",
      data: { 
        course,
        thumbnailUrl,
      },
    };
  } catch (error) {
    console.error("Error in updateCourseThumbnail:", error.message);
    throw error;
  }
};

/**
 * Add a lesson to a course
 * @param {string} courseId - Course ID
 * @param {Object} lessonData - Lesson data
 * @param {string} userId - ID of user making the request
 * @param {string} userRole - Role of user making the request
 * @returns {Object} Updated course with new lesson
 */
const addLesson = async (courseId, lessonData, userId, userRole) => {
  try {
    const course = await Course.findById(courseId);

    if (!course) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    // Check authorization
    if (course.instructor.toString() !== userId && userRole !== "admin") {
      const error = new Error("You are not authorized to modify this course");
      error.statusCode = 403;
      throw error;
    }

    // Add lesson
    course.lessons.push(lessonData);
    
    // Update total counts
    course.totalLessons = course.lessons.length;
    course.totalDuration = course.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
    
    await course.save();

    return {
      success: true,
      message: "Lesson added successfully",
      data: { 
        course,
        lesson: course.lessons[course.lessons.length - 1],
      },
    };
  } catch (error) {
    console.error("Error in addLesson:", error.message);
    throw error;
  }
};

/**
 * Update a lesson in a course
 * @param {string} courseId - Course ID
 * @param {string} lessonId - Lesson ID (array index or lesson _id)
 * @param {Object} lessonData - Updated lesson data
 * @param {string} userId - ID of user making the request
 * @param {string} userRole - Role of user making the request
 * @returns {Object} Updated course
 */
const updateLesson = async (courseId, lessonId, lessonData, userId, userRole) => {
  try {
    const course = await Course.findById(courseId);

    if (!course) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    // Check authorization
    if (course.instructor.toString() !== userId && userRole !== "admin") {
      const error = new Error("You are not authorized to modify this course");
      error.statusCode = 403;
      throw error;
    }

    // Find lesson by _id
    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      const error = new Error("Lesson not found");
      error.statusCode = 404;
      throw error;
    }

    // Update lesson fields
    Object.keys(lessonData).forEach((key) => {
      if (lessonData[key] !== undefined) {
        lesson[key] = lessonData[key];
      }
    });

    // Recalculate total duration
    course.totalDuration = course.lessons.reduce((total, l) => total + (l.duration || 0), 0);
    
    await course.save();

    return {
      success: true,
      message: "Lesson updated successfully",
      data: { course, lesson },
    };
  } catch (error) {
    console.error("Error in updateLesson:", error.message);
    throw error;
  }
};

/**
 * Delete a lesson from a course
 * @param {string} courseId - Course ID
 * @param {string} lessonId - Lesson ID
 * @param {string} userId - ID of user making the request
 * @param {string} userRole - Role of user making the request
 * @returns {Object} Updated course
 */
const deleteLesson = async (courseId, lessonId, userId, userRole) => {
  try {
    const course = await Course.findById(courseId);

    if (!course) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    // Check authorization
    if (course.instructor.toString() !== userId && userRole !== "admin") {
      const error = new Error("You are not authorized to modify this course");
      error.statusCode = 403;
      throw error;
    }

    // Remove lesson
    course.lessons = course.lessons.filter((lesson) => lesson._id.toString() !== lessonId);
    
    // Update total counts
    course.totalLessons = course.lessons.length;
    course.totalDuration = course.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
    
    await course.save();

    return {
      success: true,
      message: "Lesson deleted successfully",
      data: { course },
    };
  } catch (error) {
    console.error("Error in deleteLesson:", error.message);
    throw error;
  }
};

/**
 * Get courses by instructor
 * @param {string} instructorId - Instructor ID
 * @param {Object} options - Query options
 * @returns {Object} List of courses by instructor
 */
const getCoursesByInstructor = async (instructorId, options = {}) => {
  try {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { instructor: instructorId };
    
    // Filter by status if provided
    if (options.status) {
      filter.status = options.status;
    }

    const courses = await Course.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);

    return {
      success: true,
      data: {
        courses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error in getCoursesByInstructor:", error.message);
    throw error;
  }
};

/**
 * Get enrolled courses for a student
 * @param {string} userId - ID of the user
 * @param {Object} options - Pagination options
 * @returns {Object} List of enrollments populated with course details
 */
const getMyEnrollments = async (userId, options = {}) => {
  try {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const skip = (page - 1) * limit;

    const enrollments = await Enrollment.find({ user: userId })
      .populate({
        path: "course",
        populate: { path: "instructor", select: "name email avatar" }
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Enrollment.countDocuments({ user: userId });

    return {
      success: true,
      data: {
        enrollments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error in getMyEnrollments:", error.message);
    throw error;
  }
};

/**
 * Enroll a student in a course
 * @param {string} courseId - ID of the course
 * @param {string} userId - ID of the user requesting enrollment
 * @returns {Object} Newly created enrollment
 */
const enrollInCourse = async (courseId, userId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    if (course.status !== "published") {
      const error = new Error("Cannot enroll in an unpublished course");
      error.statusCode = 400;
      throw error;
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (existingEnrollment) {
      const error = new Error("You are already enrolled in this course");
      error.statusCode = 400;
      throw error;
    }

    // Create enrollment
    const enrollment = new Enrollment({
      user: userId,
      course: courseId,
    });

    await enrollment.save();

    // Increment enrolledStudents count in course
    course.enrolledStudents += 1;
    await course.save();

    return {
      success: true,
      message: "Successfully enrolled in the course",
      data: { enrollment },
    };
  } catch (error) {
    console.error("Error in enrollInCourse:", error.message);
    throw error;
  }
};

// Export all service functions
module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseThumbnail,
  addLesson,
  updateLesson,
  deleteLesson,
  getCoursesByInstructor,
  enrollInCourse,
  getMyEnrollments,
};
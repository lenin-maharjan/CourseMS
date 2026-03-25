/**
 * Course Model
 * 
 * This model defines the structure of a Course in the database.
 * A course represents a learning module that students can enroll in.
 */

const mongoose = require("mongoose");

// Sub-schema for course lessons/modules
const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Lesson title is required"],
    trim: true,
    maxlength: [100, "Lesson title cannot be more than 100 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Lesson description cannot be more than 500 characters"],
  },
  videoUrl: {
    type: String,
    default: null,
  },
  duration: {
    type: Number, // Duration in minutes
    default: 0,
  },
  order: {
    type: Number,
    default: 0,
  },
  isFree: {
    type: Boolean,
    default: false, // Set to true to make this lesson available for preview
  },
});

// Main Course Schema
const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a course title"],
      trim: true,
      maxlength: [100, "Course title cannot be more than 100 characters"],
    },
    
    description: {
      type: String,
      required: [true, "Please provide a course description"],
      trim: true,
      maxlength: [2000, "Description cannot be more than 2000 characters"],
    },
    
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [200, "Short description cannot be more than 200 characters"],
    },
    
    // Reference to the instructor (User model)
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide an instructor"],
    },
    
    // Course thumbnail/image
    thumbnail: {
      type: String,
      default: null, // URL to the uploaded image
    },
    
    // Course category (e.g., Programming, Design, Business)
    category: {
      type: String,
      required: [true, "Please provide a category"],
      trim: true,
    },
    
    // Course level
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    
    // Course price
    price: {
      type: Number,
      required: [true, "Please provide a price"],
      min: [0, "Price cannot be negative"],
      default: 0, // 0 means free course
    },
    
    // Original price (for showing discounts)
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
      default: null,
    },
    
    // Course status
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    
    // Language of instruction
    language: {
      type: String,
      default: "English",
    },
    
    // Total course duration in minutes
    totalDuration: {
      type: Number,
      default: 0,
    },
    
    // Number of lessons
    totalLessons: {
      type: Number,
      default: 0,
    },
    
    // Course lessons/modules
    lessons: [LessonSchema],
    
    // Tags for search and filtering
    tags: [{
      type: String,
      trim: true,
    }],
    
    // Course requirements/prerequisites
    requirements: [{
      type: String,
      trim: true,
    }],
    
    // What students will learn
    learningOutcomes: [{
      type: String,
      trim: true,
    }],
    
    // Enrollment count
    enrolledStudents: {
      type: Number,
      default: 0,
    },
    
    // Average rating
    averageRating: {
      type: Number,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"],
      default: 0,
    },
    
    // Number of reviews
    totalReviews: {
      type: Number,
      default: 0,
    },
    
    // Featured course flag
    isFeatured: {
      type: Boolean,
      default: false,
    },
    
    // Certificate available
    hasCertificate: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Index for search functionality
CourseSchema.index({ title: "text", description: "text", tags: "text" });

// Index for filtering by category
CourseSchema.index({ category: 1, status: 1 });

// Index for filtering by level
CourseSchema.index({ level: 1 });

// Virtual field to get instructor info (populated when queried)
CourseSchema.virtual("instructorInfo", {
  ref: "User",
  localField: "instructor",
  foreignField: "_id",
  justOne: true,
});

// Pre-save middleware to calculate total lessons and duration
CourseSchema.pre("save", async function() {
  if (this.lessons && this.lessons.length > 0) {
    this.totalLessons = this.lessons.length;
    this.totalDuration = this.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
  }
});

// Method to check if course is free
CourseSchema.methods.isFree = function() {
  return this.price === 0;
};

// Method to calculate discount percentage
CourseSchema.methods.getDiscountPercentage = function() {
  if (!this.originalPrice || this.originalPrice <= this.price) {
    return 0;
  }
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
};

// Static method to find published courses only
CourseSchema.statics.findPublished = function() {
  return this.find({ status: "published" });
};

const Course = mongoose.model("Course", CourseSchema);

module.exports = Course;
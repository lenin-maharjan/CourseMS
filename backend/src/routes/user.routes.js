const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controllers");
const { protect, adminOnly } = require("../middleware/auth.middleware");

// Public routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/create", userController.createUser);

// Protected routes (authentication required)
router.post("/logout", protect, userController.logout);
router.get("/profile", protect, userController.getProfile);
router.put("/profile", protect, userController.updateProfile);
router.post("/change-password", protect, userController.changePassword);

// Admin routes
router.get("/", protect, adminOnly, userController.getAllUsers);
router.get("/:id([0-9a-fA-F]{24})", protect, adminOnly, userController.getUserById);
router.delete("/:id([0-9a-fA-F]{24})", protect, adminOnly, userController.deactivateUser);

module.exports = router;
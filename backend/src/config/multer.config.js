const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsRoot = path.join(__dirname, "..", "..", "uploads");
const avatarDir = path.join(uploadsRoot, "avatar");
const courseDir = path.join(uploadsRoot, "course");

[uploadsRoot, avatarDir, courseDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only jpg, png, and webp files are allowed"), false);
  }

  cb(null, true);
};

const buildStorage = (targetDir) =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, targetDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeName = `${file.fieldname}-${Date.now()}${ext}`;
      cb(null, safeName);
    },
  });

const uploadAvatar = multer({
  storage: buildStorage(avatarDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadCourseImage = multer({
  storage: buildStorage(courseDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const getFileUrl = (filename, folder) => {
  if (!filename) return null;
  return `/uploads/${folder}/${filename}`;
};

const deleteOldFile = (filename, folder) => {
  if (!filename) return;

  const filePath = path.join(uploadsRoot, folder, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  uploadAvatar,
  uploadCourseImage,
  getFileUrl,
  deleteOldFile,
};

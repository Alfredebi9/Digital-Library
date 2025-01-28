const multer = require("multer");
const path = require("path");

// Configure storage for book files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const basePath = 'uploads/pending/';
    if (file.fieldname === 'bookFile') {
      cb(null, basePath + 'books/');
    } else if (file.fieldname === 'bookCover') {
      cb(null, basePath + 'covers/');
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "bookFile") {
    const allowedTypes = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid book file type"), false);
    }
  } else if (file.fieldname === "bookCover") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid image type"), false);
    }
  }
};

const upload2 = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for cover, 20MB for book
  },
}).fields([
  { name: "bookFile", maxCount: 1 },
  { name: "bookCover", maxCount: 1 },
]);
module.exports = { upload2 };

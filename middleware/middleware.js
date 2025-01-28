const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "bookFile") {
      cb(null, "uploads/documents/"); // Directory for book documents
    } else if (file.fieldname === "imageFile") {
      cb(null, "uploads/images/"); // Directory for book images
    } else {
      cb(new Error("Invalid file field name"), null);
    }
  },
  filename: (req, file, cb) => {
    if (file.fieldname === "bookFile") {
      const title = req.body.title.replace(/[^a-z0-9]/gi, "_").toLowerCase(); // Sanitize title
      cb(null, `${title}${path.extname(file.originalname)}`); // Append the original extension
    } else if (file.fieldname === "imageFile") {
      cb(null, file.originalname); // Keep the original image name
    } else {
      cb(new Error("Invalid file field name"), null);
    }
  },
});

const upload = multer({ storage });

module.exports = { upload };
// routes/uploadedBooks.js
const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const { UploadedBook, Book, BookView, User } = require("../db/db");
const { upload } = require("../middleware/middleware");
const auth = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/uploadAvatar");
const { upload2 } = require("../middleware/bookMiddleware");

const router = express.Router();

// New API endpoint to fetch uploaded books
router.get("/api/uploaded-books", async (req, res) => {
  try {
    const uploadedBooks = await UploadedBook.find(); // Fetch all uploaded books from the database
    res.json(uploadedBooks);
  } catch (error) {
    console.error("Error fetching uploaded books:", error);
    res.status(500).json({ message: "Failed to fetch uploaded books." });
  }
});

// API endpoint to upload a book
router.post(
  "/api/upload-book",
  upload.fields([
    { name: "bookFile", maxCount: 1 },
    { name: "imageFile", maxCount: 1 },
  ]),
  async (req, res) => {
    const { title, author, year } = req.body;

    if (
      !title ||
      !author ||
      !year ||
      !req.files?.bookFile ||
      !req.files?.imageFile
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const newBook = new UploadedBook({
        title,
        author,
        year: new Date(year),
        image: req.files.imageFile[0].path,
        file: req.files.bookFile[0].path,
        uploaded: true,
      });
      await newBook.save();
      res.status(201).json(newBook);
    } catch (error) {
      console.error("Error saving uploaded book:", error);
      res.status(500).json({ message: "Failed to save uploaded book." });
    }
  }
);

// Update an uploaded book
router.put(
  "/api/uploaded-books/:id",
  upload.fields([
    { name: "bookFile", maxCount: 1 },
    { name: "imageFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, author, year, deleteOldFile, deleteOldImage } = req.body;

      const existingBook = await UploadedBook.findById(id);
      if (!existingBook) {
        return res.status(404).json({ message: "Resource not found." });
      }

      // Delete old files only if new files are uploaded
      if (req.files.bookFile && deleteOldFile === "true" && existingBook.file) {
        await fs.unlink(path.join(__dirname, existingBook.file));
      }

      if (
        req.files.imageFile &&
        deleteOldImage === "true" &&
        existingBook.image
      ) {
        await fs.unlink(path.join(__dirname, existingBook.image));
      }

      // Update the data with new files or retain old ones
      const updatedData = {
        title: title || existingBook.title,
        author: author || existingBook.author,
        year: year ? new Date(year) : existingBook.year,
        file: req.files.bookFile
          ? req.files.bookFile[0].path
          : existingBook.file, // Retain old file
        image: req.files.imageFile
          ? req.files.imageFile[0].path
          : existingBook.image, // Retain old image
      };

      const updatedBook = await UploadedBook.findByIdAndUpdate(
        id,
        updatedData,
        {
          new: true,
        }
      );

      res.json({
        message: "Resource updated successfully.",
        book: updatedBook,
      });
    } catch (error) {
      console.error("Error updating resource:", error);
      res.status(500).json({ message: "Failed to update resource." });
    }
  }
);

// New API endpoint to search uploaded books
router.get("/api/uploaded-books/search", async (req, res) => {
  const { query } = req.query;
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

  try {
    const searchTerm = query ? query.toLowerCase() : "";

    const totalBooks = await UploadedBook.countDocuments({
      $or: [
        { title: { $regex: searchTerm, $options: "i" } }, // Search by title
        { author: { $regex: searchTerm, $options: "i" } }, // Search by author
      ],
    });

    const skip = (page - 1) * limit;

    const uploadedBooks = await UploadedBook.find({
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { author: { $regex: searchTerm, $options: "i" } },
      ],
    })
      .skip(skip) // Skip documents for previous pages
      .limit(limit) // Limit results to the specified number
      .sort({ createdAt: -1 }); // Optional: Sort by creation date

    res.json({
      books: uploadedBooks,
      total: totalBooks,
      page,
      limit,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.error(
      "Error fetching uploaded books with search and pagination:",
      error
    );
    res.status(500).json({ message: "Failed to fetch uploaded books." });
  }
});

// Fetch uploaded book details
router.get("/api/uploaded-books/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const book = await UploadedBook.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    let description = "No description available.";
    if (book.file) {
      try {
        // Read the book file
        const filePath = path.join(__dirname, book.file);
        const fileExtension = path.extname(book.file).toLowerCase(); // Get file extension

        let fileContent;
        if (fileExtension === ".docx" || fileExtension === ".doc") {
          // Handle .docx and .doc files
          const { value } = await mammoth.extractRawText({ path: filePath });
          fileContent = value;
        } else if (fileExtension === ".pdf") {
          // Handle PDF files
          const pdfData = await fs.readFile(filePath);
          const pdfContent = await pdf(pdfData);
          fileContent = pdfContent.text;
        } else {
          // Fallback for plain text files
          fileContent = await fs.readFile(filePath, "utf-8");
        }

        // Extract the first sentence or paragraph
        const firstParagraph = fileContent.split(/\s+/).slice(0, 30).join(" "); // Split by paragraphs
        description = firstParagraph || description; // Fallback to default description if empty
      } catch (fileError) {
        console.error("Error reading book file:", fileError);
      }
    }

    res.json({
      title: book.title,
      authors: Array.isArray(book.author) ? book.author : [book.author], // Ensure authors is an array
      year: book.year.getFullYear(),
      image: `/${book.image}`, // Ensure the image URL is accessible
      description, // Use extracted description
      subjects: ["Computer Science", "computer"], // Fallback subjects
      downloadLink: `/${book.file}`, // Adjust to the file download path
    });
  } catch (error) {
    console.error("Error fetching uploaded book details:", error);
    res.status(500).json({ message: "Failed to fetch book details." });
  }
});

// Delete an uploaded book
router.delete("/api/uploaded-books/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const bookToDelete = await UploadedBook.findById(id);
    if (!bookToDelete) {
      return res.status(404).json({ message: "Resource not found." });
    }

    console.log("File to delete:", bookToDelete.file);
    console.log("Image to delete:", bookToDelete.image);

    // Construct the correct paths
    const bookFilePath = path.join(__dirname, "../", bookToDelete.file);
    const imageFilePath = path.join(__dirname, "../", bookToDelete.image);

    console.log("Deleting file:", bookFilePath);
    console.log("Deleting image:", imageFilePath);

    // Delete the files from the filesystem
    await fs.unlink(bookFilePath);
    await fs.unlink(imageFilePath);

    await UploadedBook.findByIdAndDelete(id);
    res.status(200).json({ message: "Resource deleted successfully." });
  } catch (error) {
    console.error("Error deleting uploaded book:", error);
    res.status(500).json({ message: "Failed to delete uploaded book." });
  }
});

// Clear the database
router.delete("/api/books/clear", async (req, res) => {
  try {
    await BookView.deleteMany({});
    res.json({ message: "Database cleared successfully." });
  } catch (error) {
    console.error("Error clearing the database:", error);
    res.status(500).json({ message: "Failed to clear the database." });
  }
});

router.post("/api/books", (req, res) => {
  upload2(req, res, async (err) => {
    try {
      if (err) {
        throw new Error(err.message);
      }

      // Validate fields
      const { title, author, publishYear } = req.body;
      if (!title || !author || !publishYear) {
        throw new Error("All fields are required");
      }

      // Validate date
      const year = new Date(publishYear);
      if (isNaN(year.getTime())) {
        throw new Error("Invalid publication date");
      }

      // Create new book entry with pending status
      const newBook = new Book({
        title,
        author,
        publishYear: year,
        bookFile: req.files.bookFile[0].path.replace(/\\/g, "/"),
        bookCover: req.files.bookCover[0].path.replace(/\\/g, "/"),
        status: "pending",
      });

      await newBook.save();

      res.status(201).json({
        message: "Book submitted for approval",
        book: newBook,
      });
    } catch (error) {
      console.error("Book upload error:", error);

      // Cleanup uploaded files if error occurred
      if (req.files) {
        Object.values(req.files).forEach((fileArray) => {
          fileArray.forEach((file) => {
            fs.unlink(file.path, () => {});
          });
        });
      }

      res.status(400).json({
        message: error.message || "Error uploading book",
      });
    }
  });
});

// Get pending books
router.get("/api/books/pending", async (req, res) => {
  try {
    const pendingBooks = await Book.find({ status: "pending" }).sort({
      submittedAt: -1,
    });
    res.json(pendingBooks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending books" });
  }
});

// Approve book
router.put("/api/books/:id/approve", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      console.error(`Book with ID ${req.params.id} not found`);
      return res.status(404).json({ message: "Book not found" });
    }

    // Move files to permanent storage
    const newBookPath = await moveFileToPermanent(book.bookFile, "books");
    const newCoverPath = await moveFileToPermanent(book.bookCover, "covers");

    // Update book record
    const approvedBook = await Book.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        bookFile: newBookPath,
        bookCover: newCoverPath,
      },
      { new: true }
    );

    res.json({ message: "Book approved successfully", book: approvedBook });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject book
router.delete("/api/books/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // Delete associated files
    fs.unlink(book.bookFile, () => {});
    fs.unlink(book.bookCover, () => {});

    res.json({ message: "Book rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting book" });
  }
});

// Helper function to move files
async function moveFileToPermanent(oldPath, type) {
  const newDir = `uploads/approved/${type}/`;
  const fileName = path.basename(oldPath);
  const newPath = path.join(newDir, fileName);

  try {
    // Create directory if it doesn't exist
    await fs.mkdir(newDir, { recursive: true });

    // Move file
    await fs.rename(oldPath, newPath);
    return newPath.replace(/\\/g, "/");
  } catch (error) {
    console.error(`Error moving file from ${oldPath} to ${newPath}:`, error);
    throw new Error("Error moving file");
  }
}

// Fetch authenticated user's data
router.get("/api/user", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude sensitive fields

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      bookmarks: user.bookmarks,
      verified: user.verified,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update user profile
router.put("/api/user", auth, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is changing
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.verified = false; // Require re-verification if email changes
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update user avatar
router.post(
  "/api/user/avatar",
  uploadAvatar.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Update avatar path
      user.avatar = `/uploads/avatars/${req.file.filename}`;
      await user.save();

      res.json({
        message: "Avatar updated successfully",
        avatarUrl: user.avatar,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Add bookmark
router.post("/api/bookmarks/:bookId", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { bookmarks: req.params.bookId } }, // Prevent duplicates
      { new: true }
    ).populate("bookmarks");

    res.json(user.bookmarks);
  } catch (error) {
    console.error("Error sending bookmarks:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// Get bookmarked books
router.get("/api/bookmarked-books", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "bookmarks",
      "title author cover description"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.bookmarks);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// Remove bookmark
router.delete("/api/bookmarks/:bookId", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { bookmarks: req.params.bookId } },
      { new: true }
    ).populate("bookmarks", "title author coveer");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Bookmark removed successfully",
      bookmarks: user.bookmarks,
    });
  } catch (error) {
    console.error("Error removing bookmarks:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;

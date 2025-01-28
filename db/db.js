const mongoose = require("mongoose");
require("dotenv").config();

const bookViewsURI = process.env.BOOK_VIEWS_DB_URI;
const authURI = process.env.AUTH_DB_URI;

const connectDB = async () => {
  try {
    // Connect to the bookviews database
    await mongoose.connect(bookViewsURI);
    console.log("MongoDB connected to bookviews database");

    // Connect to the auth database
    await mongoose.createConnection(authURI);
    console.log("MongoDB connected to auth database");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

// MongoDB Schema & Model for Book Views
const bookViewSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  timesViewed: { type: Number, default: 0 },
});

const BookView = mongoose.model("BookView", bookViewSchema, "bookviews");

// MongoDB Schema & Model for Uploaded Books
const uploadedBookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  year: { type: Date, required: true },
  image: { type: String },
  file: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  uploaded: { type: Boolean, default: true },
});

const UploadedBook = mongoose.model(
  "UploadedBook",
  uploadedBookSchema,
  "uploadedBooks"
);

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model("Contact", contactSchema, "contact");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  publishYear: { type: Date, required: true },
  bookFile: { type: String, required: true },
  bookCover: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "approved"],
    default: "pending",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: { type: Date, default: Date.now },
});
const Book = mongoose.model("Book", bookSchema);

// Create a separate connection for the auth database
const authConnection = mongoose.createConnection(authURI);

// MongoDB Schema & Model for Users in the auth database
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verified: { type: Boolean, default: false },
  avatar: { type: String, default: "/default-avatar.png" },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
  createdAt: { type: Date, default: Date.now },
  admin: {
    type: Boolean,
    default: false,
  },
});

// Create the User model using the auth connection
const User = authConnection.model("User", userSchema, "users");

module.exports = { connectDB, BookView, UploadedBook, User, Contact, Book };

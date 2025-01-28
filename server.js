// server.js
const express = require("express");
const session = require("express-session");
const path = require("path");
const { connectDB, User, Contact } = require("./db/db");
const routes = require("./routes/routes");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

require("dotenv").config();

const app = express();
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use((req, res, next) => {
  // Redirect logged-in admins trying to access home
  if (req.session.admin && req.path === "/") {
    return res.redirect("/admin-dashboard");
  }
  next();
});

// Serve static files (CSS, JS, Images, HTML)
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
connectDB();

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.get("/verify-email/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    // Set the user's verification to true
    user.verified = true;
    await user.save();

    res.redirect(`/login?message=Registration successful`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error verifying email");
  }
});

// User Registration Endpoint
app.post("/api/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Server-side validation
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;

  if (!passwordPattern.test(password)) {
    return res.status(400).json({
      message: `Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.`,
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      verified: false,
      avatar: "/default-avatar.png", // Default avatar
      bookmarks: [], // Initialize empty bookmarks
    });

    await newUser.save();

    // Send verification email
    const verificationLink = `http://localhost:3000/verify-email/${newUser._id}`;
    await transporter.sendMail({
      from: `UNN Library of Computer Science <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Email Verification",
      text: `Please click the link below to verify your email: ${verificationLink}`,
      html: `<p>Please click the link below to verify your email:</p><a href="${verificationLink}">Verify Email</a>`,
    });

    // Return user data without sensitive information
    const userData = {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      avatar: newUser.avatar,
      verified: newUser.verified,
    };

    res.status(201).json({
      message:
        "User registered successfully. Please check your email to verify your account.",
      user: userData,
      redirect: "/login",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Check if the user is verified
    if (!user.verified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Return user data without sensitive information
    const userData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      bookmarks: user.bookmarks,
      verified: user.verified,
    };

    // Determine redirect based on admin status
    const redirectPath = user.admin ? "/admin-dashboard" : "/";

    // Successful login
    req.session.userId = user._id;
    req.session.authenticated = true;
    req.session.admin = user.admin;

    res.status(200).json({
      message: "Login successful.",
      user: userData,
      redirect: redirectPath,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie("connect.sid"); // Adjust cookie name if needed
    res
      .status(200)
      .json({ message: "Logged out successfully", redirect: "/login" });
  });
});

// server.js (contact endpoint)
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    // Save to database
    const newContact = new Contact({
      name,
      email,
      subject,
      message,
    });

    await newContact.save();

    // Send email
    await transporter.sendMail({
      from: `Contact Form`,
      to: process.env.EMAIL_USER,
      subject: `New Contact Message: ${subject}`,
      html: `
        <h3>New Message from ${name}</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Forgot Password Route
// app.post("/api/forgot-password", async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Generate reset token and expiration
//     const resetToken = crypto.randomBytes(20).toString("hex");
//     const resetTokenExpiration = Date.now() + 3600000; // 1 hour

//     // Save token to user document
//     user.resetToken = resetToken;
//     user.resetTokenExpiration = resetTokenExpiration;
//     await user.save();

//     // Send email with reset link
//     const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
//     await transporter.sendMail({
//       from: `UNN Library of Computer Science <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "Password Reset Request",
//       html: `
//         <p>You requested a password reset. Click the link below to set a new password:</p>
//         <a href="${resetLink}">Reset Password</a>
//         <p>This link will expire in 1 hour.</p>
//       `,
//     });

//     res.json({ message: "Password reset link sent to your email" });
//   } catch (error) {
//     console.error("Password reset error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // Reset Password Route
// app.post("/api/reset-password", async (req, res) => {
//   const { token, password } = req.body;

//   try {
//     const user = await User.findOne({
//       resetToken: token,
//       resetTokenExpiration: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired token" });
//     }

//     // Validate new password
//     const passwordPattern =
//       /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
//     if (!passwordPattern.test(password)) {
//       return res.status(400).json({
//         message: `Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.`,
//       });
//     }

//     // Update password and clear reset token
//     user.password = await bcrypt.hash(password, 10);
//     user.resetToken = undefined;
//     user.resetTokenExpiration = undefined;
//     await user.save();

//     res.json({ message: "Password reset successful" });
//   } catch (error) {
//     console.error("Password reset error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// Middleware (should be defined before routes)
const requireAdmin = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user || !user.admin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//  /api/admin/users endpoint
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    console.log("Fetching users from DB...");
    const users = await User.find({}, "-password -__v")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: users.length,
      data: users, // Wrap in data property
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Delete user (admin only)
app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    // Verify admin privileges
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const adminUser = await User.findById(req.session.userId);
    if (!adminUser || !adminUser.admin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin Messages Endpoints
app.get("/api/admin/messages", requireAdmin, async (req, res) => {
  try {
    // Verify admin (you should implement proper admin authentication)
    const token = req.headers.authorization?.split(" ")[1];
    // Add proper JWT verification here

    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/admin/messages/:id/read", requireAdmin, async (req, res) => {
  try {
    await Contact.findByIdAndUpdate(req.params.id, { read: true });
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/admin/reply/:id", requireAdmin, async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Send reply email
    await transporter.sendMail({
      from: `Library Support <${process.env.EMAIL_USER}>`,
      to: message.email,
      subject: `Re: ${message.subject}`,
      html: `
              <p>Dear ${message.name},</p>
              <p>${req.body.reply}</p>
              <hr>
              <p><em>Original message:</em></p>
              <blockquote>${message.message}</blockquote>
          `,
    });

    res.json({ message: "Reply sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending reply" });
  }
});

// Use routes
app.use("/", routes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

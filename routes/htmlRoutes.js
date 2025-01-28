const express = require("express");
const path = require("path");
const router = express.Router();
const {User} = require("../db/db");

function requireAuth(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Add this before your route definitions
async function requireAdmin(req, res, next) {
  try {
    // First check if user is authenticated
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    // Then check admin status
    const user = await User.findById(req.session.userId);
    if (!user || !user.admin) {
      return res.status(403).send("Forbidden");
    }

    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).send("Server error");
  }
}

const htmlRoutes = [
  // Public routes
  { route: "/login", file: "root/login.html", protected: false },
  { route: "/register", file: "root/register.html", protected: false },

  // Regular user routes (protected but not admin)
  { route: "/", file: "root/index.html", protected: true },
  { route: "/catalog", file: "root/user/catalog.html", protected: true },
  { route: "/resource", file: "root/user/resource.html", protected: true },
  {
    route: "/user-profile",
    file: "root/user/userProfile.html",
    protected: true,
  },
  { route: "/contact-us", file: "root/user/contactUs.html", protected: true },
  { route: "/about", file: "root/user/about.html", protected: true },

  // Admin routes
  {
    route: "/admin-dashboard",
    file: "root/admin/adminDashboard.html",
    protected: true,
    adminOnly: true,
  },
  {
    route: "/admin-Message",
    file: "root/admin/adminMessage.html",
    protected: true,
    adminOnly: true,
  },
  {
    route: "/admin-approval",
    file: "root/admin/adminApproval.html",
    protected: true,
    adminOnly: true,
  },
  {
    route: "/resources-overview",
    file: "root/admin/resourcesOverview.html",
    protected: true,
    adminOnly: true,
  },
  {
    route: "/manage-resources",
    file: "root/admin/manageResources.html",
    protected: true,
    adminOnly: true,
  },
  {
    route: "/manage-users",
    file: "root/admin/manageUsers.html",
    protected: true,
    adminOnly: true,
  },
];

htmlRoutes.forEach(({ route, file, protected, adminOnly }) => {
  const handlers = [];

  // Add protection middleware
  if (protected) {
    if (adminOnly) {
      handlers.push(requireAuth, requireAdmin);
    } else {
      handlers.push(requireAuth);
    }
  }

  // Add file serving handler
  handlers.push((req, res) => {
    res.sendFile(path.join(__dirname, "../public", file));
  });

  router.get(route, handlers);
});

module.exports = router;

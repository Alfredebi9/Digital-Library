// routes/apiRoutes.js
const express = require("express");
const bookSearch = require("./bookSearch");
const topViewedBooks = require("./topViewedBooks");
const incrementView = require("./incrementView");
const bookDetails = require("./bookDetails");
const uploadedBooks = require("./uploadedBooks");

const router = express.Router();

// Use individual route files
router.use("/", bookSearch);
router.use("/", topViewedBooks);
router.use("/", incrementView);
router.use("/", uploadedBooks);
router.use("/", bookDetails);

module.exports = router;
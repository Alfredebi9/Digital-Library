// routes/topViewedBooks.js
const express = require("express");
const { BookView } = require("../db/db");

const router = express.Router();

// Fetch top viewed books
router.get("/api/books/top-viewed", async (req, res) => {
  try {
    const topBooks = await BookView.find().sort({ timesViewed: -1 }).limit(10);
    res.json(topBooks);
  } catch (error) {
    console.error("Error fetching top viewed books:", error);
    res.status(500).json({ message: "Failed to fetch top viewed books." });
  }
});

module.exports = router;
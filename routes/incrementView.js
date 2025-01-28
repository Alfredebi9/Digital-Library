// routes/incrementView.js
const express = require("express");
const { BookView } = require("../db/db");

const router = express.Router();

// Increment times viewed for a book
router.post("/api/books/increment-view", async (req, res) => {
  const { title, author } = req.body;

  if (!title || !author) {
    return res.status(400).json({ message: "Title and author are required." });
  }

  try {
    const book = await BookView.findOneAndUpdate(
      { title, author },
      { $inc: { timesViewed: 1 } },
      { new: true, upsert: true }
    );
    res.json({ message: "View count updated.", book });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    res.status(500).json({ message: "Failed to update view count." });
  }
});

module.exports = router;
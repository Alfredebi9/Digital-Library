// routes/bookDetails.js
const express = require("express");
let fetch;

(async () => {
  fetch = await import("node-fetch").then((module) => module.default);
})();

const router = express.Router();

// Fetch computer science book details from Open Library API
router.get("/api/books/:key", async (req, res) => {
  let { key } = req.params;
  key = key.replace(/^\/works\//, "");

  const year = req.query.year; // This will get the year passed in the URL

  console.log("Requested book key:", key, "Year:", year); // Log for debugging

  try {
    const bookResponse = await fetch(
      `https://openlibrary.org/works/${key}.json`
    );
    if (!bookResponse.ok) throw new Error("Failed to fetch book details");
    const book = await bookResponse.json();

    const authors = await Promise.all(
      (book.authors || []).map(async (author) => {
        try {
          const authorResponse = await fetch(
            `https://openlibrary.org${author.author.key}.json`
          );
          if (!authorResponse.ok) return { name: "Unknown Author" };
          const authorData = await authorResponse.json();
          return { name: authorData.name };
        } catch {
          return { name: "Unknown Author" };
        }
      })
    );

    const subjects = (book.subjects || []).map((s) => s.toLowerCase());
    const isComputerScience =
      subjects.some(
        (s) =>
          s.includes("computer") ||
          s.includes("programming") ||
          s.includes("software")
      ) || book.title.toLowerCase().includes("computer");

    if (!isComputerScience) {
      return res
        .status(404)
        .json({ message: "Book not found in computer science category" });
    }

    const publishYear = book.first_publish_year || year || "Unknown"; // Use the year from the query if available

    res.json({
      title: book.title,
      description:
        typeof book.description === "string"
          ? book.description
          : book.description?.value || "No description available.",
      subjects: book.subjects || [],
      authors: authors.map((author) => author.name),
      year: publishYear, // Use the publishYear variable
      image: book.covers?.length
        ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`
        : null,
      downloadLink: `https://openlibrary.org/works/${key}/download`,
    });
  } catch (error) {
    console.error("Error fetching book details:", error);
    res.status(500).json({ message: "Error fetching book details" });
  }
});

module.exports = router;

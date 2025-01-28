// routes/bookSearch.js
const express = require("express");
const { BookView } = require("../db/db");
let fetch;

(async () => {
  fetch = await import("node-fetch").then((module) => module.default);
})();

const router = express.Router();

// Fetch books from Open Library API
router.get("/api/books/search", async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;
  const searchTerm = query || "computer science"; // Default to 'computer science' if no query is provided
  console.log(`Search Term: ${searchTerm}, Page: ${page}, Limit: ${limit}`);

  try {
    const openLibraryUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(
      searchTerm
    )}&subject=computer_science&page=${page}`;

    const openLibraryResponse = await fetch(openLibraryUrl);
    const openLibraryData = await openLibraryResponse.json();

    if (!openLibraryData.docs || openLibraryData.docs.length === 0) {
      return res.json({
        books: [],
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    }

    const books = openLibraryData.docs
      .map((item) => {
        let relevanceScore = 0;
        const searchTerms = query ? query.toLowerCase().split(" ") : [];
        const title = item.title.toLowerCase();
        const subjects = (item.subject || []).map((s) => s.toLowerCase());

        searchTerms.forEach((term) => {
          if (title.includes(term)) relevanceScore += 3;
        });

        subjects.forEach((subject) => {
          if (subject.includes("computer science")) relevanceScore += 2;
          if (subject.includes("programming")) relevanceScore += 2;
          if (subject.includes("software")) relevanceScore += 2;
          searchTerms.forEach((term) => {
            if (subject.includes(term)) relevanceScore += 1;
          });
        });

        return {
          title: item.title,
          authors: item.author_name || ["Unknown Author"],
          year: item.first_publish_year || "N/A",
          image: item.cover_i
            ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`
            : null,
          key: item.key.replace("/works/", ""),
          downloadLink: `https://openlibrary.org${item.key}/download`,
          relevanceScore,
        };
      })
      .filter((item) => item.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    const totalFilteredBooks = books.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBooks = books
      .slice(startIndex, endIndex)
      .map(({ title, authors, year, image, key, downloadLink }) => ({
        title,
        authors,
        year,
        image,
        key,
        downloadLink,
      }));

    res.json({
      books: paginatedBooks,
      total: totalFilteredBooks,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching computer science books" });
  }
});

module.exports = router;
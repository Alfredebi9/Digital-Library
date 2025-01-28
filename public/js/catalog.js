"use strict";

let currentPage = 1; // Track the current page
let currentQuery = ""; // Track the current search query

const catalogContainer = document.getElementById("catalogItems");
const searchBar = document.getElementById("searchBar");
const paginationContainer = document.getElementById("pagination");

const openLibraryBooksDates = []; // Store dates for Open Library books
const uploadedBooksDates = []; // Store dates for uploaded books

// Debounce function to delay the execution of search
function debounce(fn, delay) {
  return function (...args) {
    clearTimeout(debounceTimeout); // Clear the previous timeout
    debounceTimeout = setTimeout(() => fn(...args), delay); // Set new timeout
  };
}

// Show loading indicator
function showLoading() {
  catalogContainer.innerHTML = `
      <div class="text-center mt-4">
        <div class="spinner-border" style="color: #5a3f90" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p>Loading books...</p>
      </div>`;
}

// Display "no results" message
function showNoResults() {
  catalogContainer.innerHTML = `
      <div class="text-center mt-4">
        <p class="text-danger">No books found. Please try another search.</p>
      </div>`;
}

// Display error message
function showError() {
  catalogContainer.innerHTML = `
      <div class="text-center mt-4">
        <p class="text-danger">An error occurred while fetching books. Please try again later.</p>
      </div>`;
}

// Utility function to truncate text to a specific length
function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// Notify the backend when the user views a book
function notifyView(title, authors) {
  fetch("/api/books/increment-view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, author: authors.join(", ") }),
  }).catch((error) => console.error("Error updating view count:", error));
}

// ... existing code ...

// Update the "View Details" button in the displayCatalog function
function displayCatalog(items) {
  catalogContainer.innerHTML = items
    .map((item) => {
      const truncatedTitle = truncateText(item.title, 50);
      const authors = Array.isArray(item.authors)
        ? item.authors
        : [item.author || "Unknown Author"];
      const truncatedAuthors = truncateText(authors.join(", "), 50);

      let formattedYear;
      if (item.uploaded) {
        // Handle uploaded book
        const uploadDate = new Date(item.year);
        formattedYear = uploadDate
          ? `${String(uploadDate.getDate()).padStart(2, "0")}-${String(
              uploadDate.getMonth() + 1
            ).padStart(2, "0")}-${String(uploadDate.getFullYear()).slice(-2)}`
          : "N/A";
        uploadedBooksDates.push(uploadDate.getFullYear()); // Store only the year of the uploaded book
      } else {
        // Handle Open Library book
        formattedYear = item.year || "N/A";
        openLibraryBooksDates.push(formattedYear); // Add to Open Library books dates
      }

      return `  
      <div class="col-lg-3 col-md-4 col-sm-6">  
        <div class="card mb-4 text-center border-0 bg-transparent">  
          <img src="${item.image}" class="card-img-top catalog-image" alt="${
        item.title
      }">  
          <div class="card-body m-0 p-1 text-start">  
            <h6 class="card-title"><strong>${truncatedTitle}</strong></h6>  
            <p class="card-text"><strong>Authors:</strong> ${truncatedAuthors}</p>  
            <p class="card-text"><strong>Year:</strong> ${formattedYear}</p>  
            <a href="/resource?key=${item.key || item._id}&year=${
        item.year
      }&uploaded=${
        item.uploaded ? "true" : "false"
      }" class="btn bgColor text-light"   
              onclick="notifyView('${item.title}', ['${authors.join(
        "','"
      )}'])">  
              View Details  
            </a>  
          </div>  
        </div>  
      </div>`;
    })
    .join("");

  console.log("Open Library Books Dates:", openLibraryBooksDates);
  console.log("Uploaded Books Dates:", uploadedBooksDates);
}

// Display pagination buttons
function displayPagination(total, page, limit) {
  const maxPages = 10; // Max pages if total >= 200
  const totalPages = total >= 200 ? maxPages : Math.ceil(total / limit); // Dynamically calculate or cap at 10
  paginationContainer.innerHTML = "";

  if (totalPages <= 1) return; // No pagination if only one page

  // Previous button
  if (page > 1) {
    paginationContainer.innerHTML += `
      <button class="btn btn-light mx-1"
        onclick="fetchBooks('${currentQuery}', ${page - 1})">Previous</button>`;
  }

  // First page button
  paginationContainer.innerHTML += `
    <button class="btn ${page === 1 ? "btn-primary" : "btn-light"} mx-1"
      onclick="fetchBooks('${currentQuery}', 1)">1</button>`;

  // Ellipsis if needed
  if (page > 3) {
    paginationContainer.innerHTML += `<span class="mx-1">...</span>`;
  }

  // Surrounding page buttons
  const startPage = Math.max(2, page - 1);
  const endPage = Math.min(totalPages - 1, page + 1);
  for (let i = startPage; i <= endPage; i++) {
    paginationContainer.innerHTML += `
      <button class="btn ${i === page ? "btn-primary" : "btn-light"} mx-1"
        onclick="fetchBooks('${currentQuery}', ${i})">${i}</button>`;
  }

  // Ellipsis if needed
  if (page < totalPages - 2) {
    paginationContainer.innerHTML += `<span class="mx-1">...</span>`;
  }

  // Last page button
  paginationContainer.innerHTML += `
    <button class="btn ${
      page === totalPages ? "btn-primary" : "btn-light"
    } mx-1"
      onclick="fetchBooks('${currentQuery}', ${totalPages})">${totalPages}</button>`;

  // Next button
  if (page < totalPages) {
    paginationContainer.innerHTML += `
      <button class="btn btn-light mx-1"
        onclick="fetchBooks('${currentQuery}', ${page + 1})">Next</button>`;
  }
}

// Fetch books from the server
function fetchBooks(query = "", page = 1) {
  showLoading();
  currentQuery = query;
  currentPage = page;

  // Update the URL with query parameters
  const url = `/catalog?page=${page}&query=${encodeURIComponent(query)}`;
  // window.history.pushState({ page, query }, "", url); // Update the URL without reloading

  const apiUrl = `/api/books/search?query=${encodeURIComponent(
    query
  )}&page=${page}&limit=20`;

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch books");
      return response.json();
    })
    .then(({ books, total }) => {
      if (books.length === 0) {
        // If no books found, check uploaded books
        return fetch(
          `/api/uploaded-books/search?query=${encodeURIComponent(query)}`
        ).then((response) => {
          if (!response.ok) throw new Error("Failed to fetch uploaded books");
          return response.json();
        });
      }
      return { books, total }; // Return the found books
    })
    .then((result) => {
      if (Array.isArray(result)) {
        // If result is an array, it means we fetched uploaded books
        const uploadedBooks = result;
        if (uploadedBooks.length === 0) {
          showNoResults(); // No results found in both searches
        } else {
          displayCatalog(uploadedBooks); // Display uploaded books
        }
      } else {
        // Display the regular books
        const { books, total } = result;
        displayCatalog(books);
        displayPagination(total, currentPage, 20); // Update limit as needed
      }
    })
    .catch((error) => {
      console.error("Error fetching books:", error);
      showError();
    });
}

// Load default books on page load
window.addEventListener("DOMContentLoaded", () => {
  // Check if URL has query parameters for page and query
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get("page") || 1;
  const queryParam = urlParams.get("query") || "";

  currentPage = parseInt(pageParam);
  currentQuery = queryParam;

  fetchBooks(currentQuery, currentPage);

  // Add search event listener
  searchBar.addEventListener(
    "input",
    debounce((e) => {
      const query = e.target.value.trim();
      fetchBooks(query || ""); // Fetch based on query or show default results
    }, 3000)
  );
});

// Trigger search on both Enter key press and icon click
function triggerSearch() {
  const query = searchBar.value.trim();
  fetchBooks(query || "");
}

// Load default books on page load
window.addEventListener("DOMContentLoaded", () => {
  // Check if URL has query parameters for page and query
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get("page") || 1;
  const queryParam = urlParams.get("query") || "";

  currentPage = parseInt(pageParam);
  currentQuery = queryParam;

  fetchBooks(currentQuery, currentPage);

  // Add search event listener
  searchBar.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    fetchBooks(query || ""); // Fetch based on query or show default results
  });

  // Add event listener for the search icon click
  document
    .getElementById("searchIcon")
    .addEventListener("click", triggerSearch);

  // Add keypress event listener for Enter key
  searchBar.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      triggerSearch();
    }
  });
});

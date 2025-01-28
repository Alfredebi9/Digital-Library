const resourceContainer = document.getElementById("resourceDetails");
const params = new URLSearchParams(window.location.search);
const bookKey = params.get("key");
const isUploaded = params.get("uploaded") === "true";
const bookYear = params.get("year");

console.log(bookYear);
function showLoading() {
  resourceContainer.innerHTML = `
    <div class="text-center mt-4">
      <div class="spinner-border" style="color: #5a3f90" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading book details...</p>
    </div>`;
}

if (!bookKey) {
  resourceContainer.innerHTML = `
    <div class="text-center">
      <p class="text-danger">Invalid book key. Please try again.</p>
    </div>`;
} else {
  showLoading();
  // Determine the API endpoint based on `isUploaded`
  const apiUrl = isUploaded
  ? `/api/uploaded-books/${bookKey}`
  : `/api/books/${bookKey}?year=${bookYear}`;

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch book details: ${response.status}`);
      }
      return response.json();
    })
    .then((book) => {
      if (!book || !book.title) {
        resourceContainer.innerHTML = `
        <div class="text-center">
          <p class="text-danger">Book not found. Please try again later.</p>
        </div>`;
        return;
      }

      const {
        image,
        title,
        description = "No description available.",
        authors = "No authors available",
        subjects = "Computer Science, computer",
        year = bookYear || "Unknown",
        downloadLink,
      } = book;

      const authorsList =
        Array.isArray(authors) && authors.length > 0
          ? authors.join(", ")
          : "No authors available";
      const subjectsList =
        Array.isArray(subjects) && subjects.length > 0
          ? subjects.join(", ")
          : "Computer Science, computer";

          resourceContainer.innerHTML = `
          <div class="row">
            <div class="col-md-4">
              <img src="${image}" class="img-fluid" alt="${title}">
            </div>
            <div class="col-md-8">
              <h2>${title}</h2>
              <p><strong>Description:</strong> ${description}</p>
              <p><strong>Authors:</strong> ${authorsList}</p>
              <p><strong>Subjects:</strong> ${subjectsList}</p>
              <p><strong>Year Created:</strong> ${year}</p>
              ${
                downloadLink
                  ? `<a href="${downloadLink}" class="btn bgColor text-light fs-3 px-4 py-1" target="_blank">Download</a>`
                  : ""
              }
            </div>
          </div>`;
    })
    .catch((error) => {
      console.error("Error fetching book details:", error);
      resourceContainer.innerHTML = `
  <div class="text-center">
    <p class="text-danger">An error occurred while fetching book details. Please try again later.</p>
  </div>`;
    });
}

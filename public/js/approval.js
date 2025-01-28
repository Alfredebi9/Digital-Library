// Load pending books on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/books/pending");
    const books = await response.json();

    bookList.innerHTML = books
    .map(
      (book) => `
        <div class="col-12" data-id="${book._id}">
            <div class="card book-card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-2">
                            <img src="${book.bookCover}" class="preview-image img-thumbnail" alt="Book cover">
                        </div>
                        <div class="col-md-8">
                            <h5>${book.title}</h5>
                            <p class="mb-1"><strong>Author:</strong> ${book.author}</p>
                            <p class="mb-1"><strong>Year:</strong> ${new Date(book.publishYear).getFullYear()}</p>
                            <p class="text-muted small">Submitted: ${new Date(book.submittedAt).toLocaleDateString()}</p>
                            <a href="${book.bookFile}" class="btn btn-sm btn-outline-primary" target="_blank">Preview PDF</a>
                        </div>
                        <div class="col-md-2 d-flex align-items-center">
                            <div class="d-grid gap-2 w-100">
                                <button class="btn btn-success" onclick="approveBook('${book._id}')">Approve</button>
                                <button class="btn btn-danger" onclick="rejectBook('${book._id}')">Reject</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      `
    )
    .join("");
  
  } catch (error) {
    console.error("Error loading books:", error);
  }
});

async function approveBook(bookId) {
  try {
    const response = await fetch(`/api/books/${bookId}/approve`, {
      method: "PUT",
    });
    const result = await response.json();
    if (response.ok) {
      document.querySelector(`[data-id="${bookId}"]`).remove();
      alert("Book approved successfully!");
    } else {
      alert(result.message);
    }
  } catch (error) {
    alert("Error approving book");
  }
}

async function rejectBook(bookId) {
  if (confirm("Are you sure you want to reject this book?")) {
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        document.querySelector(`[data-id="${bookId}"]`).remove();
        alert("Book rejected successfully!");
      }
    } catch (error) {
      alert("Error rejecting book");
    }
  }
}

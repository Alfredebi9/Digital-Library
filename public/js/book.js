document
  .getElementById("bookUploadForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", document.getElementById("bookTitle").value);
    formData.append("author", document.getElementById("bookAuthor").value);
    formData.append(
      "publishYear",
      document.getElementById("publishYear").value
    );
    formData.append("bookFile", document.getElementById("bookFile").files[0]);
    formData.append("bookCover", document.getElementById("bookCover").files[0]);

    // Add loading state
    const submitBtn = document.querySelector(
      '#bookUploadForm button[type="submit"]'
    );
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin me-2"></i>Uploading...';
    submitBtn.disabled = true;

    const successMessage = document.getElementById("successMessage");
    const errorMessage = document.createElement("div");
    errorMessage.className = "alert alert-danger mt-3";

    try {
      const response = await fetch("/api/books", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      successMessage.classList.remove("d-none");
      document.getElementById("bookUploadForm").reset();

      // Scroll to success message
      successMessage.scrollIntoView({
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Error:", error);
      errorMessage.textContent = error.message;
      document.querySelector(".container").appendChild(errorMessage);

      setTimeout(() => {
        errorMessage.remove();
      }, 3000);
    } finally {
      // Reset button state
      submitBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Upload Book';
      submitBtn.disabled = false;
    }
  });

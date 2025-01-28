const resourceTable = document.getElementById("resourceTable");
let resources = []; // Initialize the resources array
let editingIndex = null; // To keep track of which resource is being edited
let resourceToDelete = null; // To keep track of which resource is being deleted

function displayResources() {
  if (resources.length === 0) {
    resourceTable.innerHTML = `<p class="text-danger text-center">No resources available.</p>`;
  } else {
    resourceTable.innerHTML = `
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Year</th>
                    <th>Image</th>
                    <th>Book File</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${resources
                  .map(
                    (resource, index) => `
                <tr>
                    <td>${resource.title}</td>
                    <td>${resource.author}</td>
                    <td>${
                      resource.year
                        ? new Date(resource.year).toLocaleDateString()
                        : "N/A"
                    }</td> <!-- Format the date -->
                    <td><img src="${resource.image}" alt="${
                      resource.title
                    } image" style="width: 50px; height: auto;"></td>
                    <td><a href="${
                      resource.file
                    }" target="_blank">Download</a></td>
                    <td>
                        <button class="btn btn-warning btn-sm m-2" onclick="editResource(${index})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="showConfirmModal('Are you sure you want to delete this resource?', '${
                          resource._id
                        }')">Delete</button>
                    </td>
                </tr>`
                  )
                  .join("")}
            </tbody>
        </table>`;
  }
}

function showAddResourceModal() {
  const modal = new bootstrap.Modal(document.getElementById("resourceModal"));
  modal.show(); // Show the modal
}

function editResource(index) {
  const resource = resources[index];
  editingIndex = index; // Set the index of the resource being edited

  // Populate the modal with the resource data
  document.getElementById("author").value = resource.author;
  document.getElementById("title").value = resource.title;

  // Format the date to YYYY-MM-DD for the date input
  const formattedDate = new Date(resource.year).toISOString().split("T")[0];
  document.getElementById("year").value = formattedDate;

  // Show current file names
  document.getElementById("currentImage").innerText = resource.image
    ? resource.image.split("/").pop() // Show the current image file name
    : "No image uploaded"; // Display a message if no image is uploaded
  document.getElementById("currentDocument").innerText = resource.file
    ? resource.file.split("/").pop() // Show the current document file name
    : "No document uploaded"; // Display a message if no document is uploaded

  // Show the modal
  const modal = new bootstrap.Modal(document.getElementById("resourceModal"));
  modal.show();
}

function showMessageModal(message) {
  document.getElementById("messageContent").innerText = message;
  const modal = new bootstrap.Modal(document.getElementById("messageModal"));
  modal.show();
}

function showConfirmModal(message, resourceId) {
  document.getElementById("confirmMessageContent").innerText = message;
  resourceToDelete = resourceId; // Store the resource ID to delete
  const modal = new bootstrap.Modal(document.getElementById("confirmModal"));
  modal.show();
}

// In the submitForm function
function submitForm(event) {
  event.preventDefault(); // Prevent the default form submission

  const formData = new FormData(document.getElementById("resourceForm"));

  if (editingIndex !== null) {
    // Editing an existing resource
    const resource = resources[editingIndex];

    // Prepare data for the server
    const updateData = {
      id: resource._id,
      title: document.getElementById("title").value || resource.title,
      author: document.getElementById("author").value || resource.author,
      year: document.getElementById("year").value || resource.year,
      // Set delete flags based on whether new files are uploaded
      deleteOldImage: !document.getElementById("imageFile").files[0], // Only delete if no new image is uploaded
      deleteOldFile: !document.getElementById("bookFile").files[0], // Only delete if no new file is uploaded
    };

    // Call the replace function to handle the updates
    replaceResource(updateData);
  } else {
    // If adding a new resource, send a POST request
    fetch("/api/upload-book", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data.message) {
          showMessageModal(data.message); // Show message in modal
        }
        fetchResources(); // Refresh the resource table
        document.getElementById("resourceForm").reset(); // Clear the form
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("resourceModal")
        );
        modal.hide(); // Hide the modal after submission
      })
      .catch((error) => {
        console.error("Error:", error);
        showMessageModal("Failed to upload the book."); // Show error in modal
      });
  }
}

// In the replaceResource function
function replaceResource(updateData) {
  const formData = new FormData();
  formData.append(
    "title",
    document.getElementById("title").value || updateData.title
  );
  formData.append(
    "author",
    document.getElementById("author").value || updateData.author
  );
  formData.append(
    "year",
    document.getElementById("year").value || updateData.year
  );

  const bookFileInput = document.getElementById("bookFile").files[0];
  const imageFileInput = document.getElementById("imageFile").files[0];

  if (bookFileInput) {
    formData.append("bookFile", bookFileInput);
    formData.append("deleteOldFile", true); // Signal to delete the old file
  } else {
    formData.append("deleteOldFile", false); // Keep the old file
  }

  if (imageFileInput) {
    formData.append("imageFile", imageFileInput);
    formData.append("deleteOldImage", true); // Signal to delete the old image
  } else {
    formData.append("deleteOldImage", false); // Keep the old image
  }

  fetch(`/api/uploaded-books/${updateData.id}`, {
    method: "PUT",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        showMessageModal(data.message); // Show message in modal
      }
      fetchResources();
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("resourceModal")
      );
      modal.hide();
      editingIndex = null; // Reset editing index
    })
    .catch((error) => {
      console.error("Error:", error);
      showMessageModal("Failed to update the book."); // Show error in modal
    });
}

// Add an event listener to the confirm delete button
document
  .getElementById("confirmDeleteButton")
  .addEventListener("click", function () {
    if (resourceToDelete) {
      deleteResource(resourceToDelete); // Call the deleteResource function
    }
  });

// Delete resource function
function deleteResource(id) {
  fetch(`/api/uploaded-books/${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        showMessageModal(data.message); // Show message in modal
      }
      fetchResources(); // Refresh the resource table
    })
    .catch((error) => {
      console.error("Error:", error);
      showMessageModal("Failed to delete the resource."); // Show error in modal
    });

  // Hide the confirmation modal after action
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("confirmModal")
  );
  modal.hide();
  resourceToDelete = null; // Reset the resource ID
}

// Fetch resources when the page loads
function fetchResources() {
  fetch("/api/uploaded-books")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      resources = data; // Update the resources array with the fetched data
      displayResources(); // Call displayResources to update the UI
    })
    .catch((error) => {
      console.error("Error fetching resources:", error);
      showMessageModal("Failed to fetch resources."); // Show error in modal
    });
}

// Fetch resources when the page loads
fetchResources();

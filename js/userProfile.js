const userData = {
  name: "John Doe",
  email: "johndoe@example.com",
  borrowedBooks: [
    {
      title: "Clean Code",
      author: "Robert C. Martin",
      borrowedDate: "2024-11-01",
      dueDate: "2024-12-01",
    },
    {
      title: "Introduction to Algorithms",
      author: "Thomas H. Cormen",
      borrowedDate: "2024-11-05",
      dueDate: "2024-12-05",
    },
  ],
};

document.getElementById("userName").textContent = userData.name;
document.getElementById("userEmail").textContent = userData.email;

const borrowedResourcesContainer = document.getElementById("borrowedResources");

function displayBorrowedResources(resources) {
  if (resources.length === 0) {
    borrowedResourcesContainer.innerHTML = `
          <p class="text-danger">No borrowed resources found!</p>
      `;
  } else {
    borrowedResourcesContainer.innerHTML = `
          <table class="table table-bordered">
              <thead class="table-light">
                  <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Borrowed Date</th>
                      <th>Due Date</th>
                      <th>Status</th>
                  </tr>
              </thead>
              <tbody>
                  ${resources
                    .map(
                      (resource) => `
                          <tr>
                              <td>${resource.title}</td>
                              <td>${resource.author}</td>
                              <td>${resource.borrowedDate}</td>
                              <td>${resource.dueDate}</td>
                              <td>${
                                new Date(resource.dueDate) < new Date()
                                  ? '<span class="text-danger">Overdue</span>'
                                  : '<span class="text-success">On Time</span>'
                              }
                              </td>
                          </tr>
                      `
                    )
                    .join("")}
              </tbody>
          </table>
      `;
  }
}

displayBorrowedResources(userData.borrowedBooks);

function editProfile() {
  alert("coming soon");
}

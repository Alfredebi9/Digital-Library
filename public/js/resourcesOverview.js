document.addEventListener("DOMContentLoaded", () => {
  const borrowedBooksTable = document.getElementById("borrowedBooksTable");
  const borrowedBooksChart = document.getElementById("borrowedBooksChart");

  // Show loading indicator
  function showLoading() {
    borrowedBooksTable.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </td>
      </tr>`;
  }

  // Show error message
  function showError() {
    borrowedBooksTable.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-danger">An error occurred while fetching data. Please try again later.</td>
      </tr>`;
  }

  // Display top 10 books in the table
  function displayTopBooks(books) {
    borrowedBooksTable.innerHTML = books
      .map(
        (book, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${book.title}</td>
          <td>${book.author}</td>
          <td>${book.timesViewed}</td>
        </tr>`
      )
      .join("");
  }

  // Render chart for top books
  // Render chart for top books
  function renderChart(books) {
    const maxLabelLength = 15;
    const labels = books.map((book) =>
      book.title.length > maxLabelLength
        ? book.title.substring(0, maxLabelLength)
        : "..." + book.title
    );
    const data = books.map((book) => book.timesViewed);

    // Define an array of colors for each bar
    const colors = [
      "rgba(90, 63, 144, 0.7)",
      "rgba(255, 99, 132, 0.7)",
      "rgba(54, 162, 235, 0.7)",
      "rgba(255, 206, 86, 0.7)",
      "rgba(75, 192, 192, 0.7)",
      "rgba(153, 102, 255, 0.7)",
      "rgba(255, 159, 64, 0.7)",
      "rgba(255, 99, 132, 0.7)",
      "rgba(54, 162, 235, 0.7)",
      "rgba(75, 192, 192, 0.7)",
    ];

    // Calculate the maximum value for the y-axis
    const maxDataValue = Math.max(...data);
    const yAxisMax = Math.ceil(maxDataValue / 10) * 10; // Round up to the nearest 10

    new Chart(borrowedBooksChart, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Views",
            data,
            backgroundColor: colors.slice(0, data.length),
            borderColor: "#5a3f90",
            borderWidth: 1,
            barThickness: 30,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => `Title: ${tooltipItems[0].label}`,
              label: (tooltipItem) => `Views: ${tooltipItem.raw}`,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Books",
            },
            ticks: {
              maxRotation: 90,
              minRotation: 90,
            },
            min: 0,
          },
          y: {
            title: {
              display: true,
              text: "Views",
            },
            beginAtZero: true,
            max: yAxisMax, // Set the maximum value for the y-axis
            ticks: {
              callback: function (value) {
                return value; // Display the value as is
              },
            },
          },
        },
      },
    });
  }

  // Fetch top 10 books from the server
  function fetchTopBooks() {
    showLoading();

    fetch("/api/books/top-viewed?limit=10")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch top books.");
        return response.json();
      })
      .then((books) => {
        if (books.length === 0) {
          borrowedBooksTable.innerHTML = `
            <tr>
              <td colspan="4" class="text-center text-warning">No books data available.</td>
            </tr>`;
          borrowedBooksChart.style.display = "none";
          return;
        }
        borrowedBooksChart.style.display = "block";
        displayTopBooks(books); // Populate table with dynamic `timesViewed`
        renderChart(books); // Update chart with dynamic data
      })
      .catch((error) => {
        console.error("Error fetching top books:", error);
        showError();
      });
  }

  // Show confirmation modal
  function showConfirmClearModal() {
    const modal = new bootstrap.Modal(
      document.getElementById("confirmClearModal")
    );
    modal.show();

    // Add event listener for the confirmation button
    document.getElementById("confirmClearButton").onclick = function () {
      clearDatabaseConfirmed(); // Call the function to clear the database
      modal.hide(); // Hide the modal after confirmation
    };
  }

  // Clear the database after confirmation
  function clearDatabaseConfirmed() {
    fetch("/api/books/clear", {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to clear the database.");
        return response.json();
      })
      .then((data) => {
        showModalMessage(data.message);
        fetchTopBooks(); // Re-fetch the top books to update the display
      })
      .catch((error) => {
        console.error("Error clearing the database:", error);
        showModalMessage("An error occurred while clearing the database.");
      });
  }

  // Show modal message function
  function showModalMessage(message) {
    const messageModal = new bootstrap.Modal(
      document.getElementById("messageModal")
    );
    document.getElementById("messageContent").innerText = message; // Assuming you have an element to show the message
    messageModal.show();
  }

  // Add event listener to the button
  document
    .getElementById("clearDatabaseButton")
    .addEventListener("click", showConfirmClearModal);

  // Initialize data fetch
  fetchTopBooks();
});

"use strict";

const catalogContainer = document.getElementById("catalogItems");
const searchBar = document.getElementById("searchBar");

// Function for displaying catalog
function displayCatalog(items) {
  catalogContainer.innerHTML = items
    .map(
      (item, index) => `  
    <div class="col-lg-4 col-sm-6">  
            <div class="card">  
                <img src="${item.image}" class="card-img-top" alt="${item.title}">  
                <div class="card-body">  
                    <h6 class="card-title merriweather-heading">${item.title}</h6>  
                    <small class="card-text mb-1">Author: ${item.author}</small>  
                    <p class="card-text">Year: ${item.year}</p>  
                    <a href="/root/user/resource.html?index=${index}" class="btn bgColor text-light">View Details</a>  
                </div>  
            </div>  
        </div>`
    )
    .join("");
}

// Fetching items.json
fetch("/js/items.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  })
  .then((data) => {
    const items = data.bookItems;
    // Initialize display
    displayCatalog(items);

    // SEARCH BAR FUNCTION
    searchBar.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const filteredItems = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.author.toLowerCase().includes(query)
      );
      displayCatalog(filteredItems);
    });
  })
  .catch((error) => {
    console.error("Error fetching JSON:", error);
  });

"use strict";

const resourceContainer = document.getElementById("resourceDetails");
const params = new URLSearchParams(window.location.search);
const index = parseInt(params.get("index"), 10); // Ensure index is a number

fetch("/js/items.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  })
  .then((data) => {
    const items = data.bookItems;
    const resource = items[index];

    if (resource) {
      resourceContainer.innerHTML = `  
      <div class="col-md-4">  
          <img src="${resource.image}" class="img-fluid" alt="${resource.title}">  
          <div class="mt-3">
            <button class="btn bgColor text-light" onclick="borrowResource()">Borrow</button>  
            <button class="btn btn-secondary" onclick="reserveResource()">Reserve</button>  
          </div>
      </div>  
      <div class="col-md-8">  
          <h2 class="merriweather-heading">${resource.title}</h2>  
          <p><strong>Author:</strong> ${resource.author}</p>  
          <p><strong>Year:</strong> ${resource.year}</p>  
          <p><strong>Description:</strong> ${resource.description}</p>  
      </div>`;
    } else {
      resourceContainer.innerHTML = `<p class="text-danger">Resource not found!</p>`;
    }
  })
  .catch((error) => {
    console.error("Error fetching JSON:", error);
    resourceContainer.innerHTML = `<p class="text-danger">Error loading resource details!</p>`;
  });

function borrowResource() {
  alert("Resource borrowed successfully!");
}

function reserveResource() {
  alert("Resource reserved successfully!");
}

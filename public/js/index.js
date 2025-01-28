document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const authLinks = document.getElementById("authLinks");
  const usernameDisplay = document.getElementById("usernameDisplay");
  const usernameHero = document.getElementById("username"); // Hero section username
  const profileLink = document.getElementById("profile");
  const logoutLink = document.getElementById("logoutLink");

  // Helper functions
  const toggleElements = (action, ...elements) => {
    elements.forEach((el) => el?.classList[action]("d-none"));
  };

  try {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      toggleElements("add", authLinks);
      toggleElements("remove", profileLink, logoutLink);
      // Update both username displays
      usernameDisplay.textContent = user.firstName;
      usernameHero.textContent = user.firstName;
    } else {
      toggleElements("remove", authLinks);
      toggleElements("add", profileLink, logoutLink);
      // Clear both username displays
      usernameDisplay.textContent = "";
      usernameHero.textContent = "";
    }
  } catch (error) {
    console.error("Error:", error);
    // Default to logged-out state
    toggleElements("remove", authLinks);
    toggleElements("add", profileLink, logoutLink);
    usernameDisplay.textContent = "";
    usernameHero.textContent = "";
  }
  // Add logout functionality
  document.getElementById("logoutLink").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("user");
    window.location.href = "/login"; // Redirect to login page
  });
});

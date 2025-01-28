document.getElementById("contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formElements = e.target.elements;
  const formData = {
    name: formElements.name.value.trim(),
    email: formElements.email.value.trim(),
    subject: formElements.subject.value.trim(),
    message: formElements.message.value.trim(),
  };

  const successAlert = document.getElementById("successAlert");
  const errorAlert = document.getElementById("errorAlert");

  // Clear previous alerts
  successAlert.classList.add("d-none");
  errorAlert.classList.add("d-none");

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send message");
    }

    successAlert.textContent = data.message;
    successAlert.classList.remove("d-none");
    // Scroll to success message
    successAlert.scrollIntoView({
      behavior: "smooth",
    });
    e.target.reset();
  } catch (error) {
    console.error("Contact form error:", error);
    errorAlert.textContent = error.message;
    errorAlert.classList.remove("d-none");
  }
  setTimeout(() => {
    errorAlert.classList.add("d-none");
  }, 3000);
});

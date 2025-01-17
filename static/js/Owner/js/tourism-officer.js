document.addEventListener("DOMContentLoaded", () => {
    const profileDropdownButton = document.getElementById("profileDropdownButton");
    const profileDropdown = document.getElementById("profileDropdown");

    // Toggle the profile dropdown menu
    profileDropdownButton.addEventListener("click", () => {
        profileDropdown.classList.toggle("show");
    });

    // Close the dropdown if clicked outside
    document.addEventListener("click", (event) => {
        if (!profileDropdownButton.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove("show");
        }
    });
});
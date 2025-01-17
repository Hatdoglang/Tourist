

// Setup Event Listeners
function setupEventListeners() {
    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = "/login";
        }).catch((error) => {
            console.error("Error during logout:", error);
        });
    });
}

// Load User Data
async function loadUserData(userId) {
    try {
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            document.getElementById('userName').innerText = userData.name || "Officer";
        } else {
            console.error("User data not found.");
        }
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}
function initializeSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const dashboardContainer = document.querySelector('.dashboard-container');

    if (!navItems.length || !sections.length) {
        console.warn("No navigation items or sections found!");
        return; // Exit if no nav items or sections are found
    }

    // Function to activate a tab and apply active styles
    const activateTab = (targetId) => {
        // Deactivate all sections and nav items
        sections.forEach(section => section.classList.remove('active'));
        navItems.forEach(item => item.classList.remove('active'));

        // Activate the target section
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
        } else {
            console.warn(`Section with ID "${targetId}" not found.`);
            return;
        }

        // Highlight the corresponding nav item
        const activeNavItem = Array.from(navItems).find(
            item => item.getAttribute('href') === `#${targetId}`
        );
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Update container styling for sentiment-analysis
        if (dashboardContainer) {
            if (targetId === 'sentiment-analysis') {
                dashboardContainer.classList.add('sentiment-analysis-active');
            } else {
                dashboardContainer.classList.remove('sentiment-analysis-active');
            }
        }

        // Scroll to the section smoothly
        targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    // Add event listeners to navigation items
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href').substring(1); // Get ID without the '#'
            activateTab(targetId);
        });
    });

    // Activate the first tab by default
    const defaultTabId = navItems[0].getAttribute('href').substring(1);
    activateTab(defaultTabId);
}

// Call the function after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeSidebar();
});


document.addEventListener('DOMContentLoaded', function () {
    const profileDropdownButton = document.getElementById('profileDropdownButton');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutButton = document.getElementById('logoutButton');
    
    // Toggle dropdown on button click
    profileDropdownButton.addEventListener('click', function(event) {
        event.stopPropagation();  // Prevent click from propagating to body
        profileDropdown.classList.toggle('show'); // Toggle 'show' class
    });

    // Close the dropdown if clicked outside
    document.addEventListener('click', function(event) {
        if (!profileDropdownButton.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove('show');
        }
    });

    // Handle logout
    logoutButton.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default link behavior
        fetch('/logout', { method: 'GET' })
            .then(response => {
                if (response.ok) {
                    // Redirect to login page after successful logout
                    window.location.href = '/'; // Redirect to the login page
                } else {
                    alert('Error logging out');
                }
            })
            .catch(error => console.error('Error:', error));
    });
});


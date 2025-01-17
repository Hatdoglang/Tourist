// Firebase Configuration and Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getDatabase, ref, get, remove } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";


// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDbNXaBjr2FVNN3nC4W8CUa9DlQwR2D87s",
    authDomain: "csas-158fc.firebaseapp.com",
    databaseURL: "https://csas-158fc-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "csas-158fc",
    storageBucket: "csas-158fc.firebasestorage.app",
    messagingSenderId: "763041820862",
    appId: "1:763041820862:web:c11981b07960e91ece6eef",
    measurementId: "G-26BMZST2LE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

window.addEventListener('DOMContentLoaded', () => {
    // Use onAuthStateChanged correctly here
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in:", user);
            fetchUserData(user.uid);
        } else {
            console.log("User not logged in");
            window.location.href = "/loginpage-owner-manager";
        }
    });
});


// Define the stop words list
const stopWords = new Set([
    "the", "this", "a", "an", "us", "i", "it", "is", "to", "for", "and", "on", "at", "with", "by", "of", "be", "in", "as", "that", "are", "from", "or", "was", "were", "but", "which", "when", "how", "you", "your", "ours", "he", "she", "they"
]);


// Fetch user data (name, resort, and reviews)
async function fetchUserData(userId) {
    try {
        const userRef = ref(database, 'users/' + userId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const userName = userData.name || "Guest"; // Fallback to "Guest"
            document.getElementById('userName').innerText = userName;

            const resortId = userData.resort || null; // Get resort ID from user data
            if (resortId) {
                // Fetch and display resort details and review statistics
                fetchResortDetails(resortId);
                fetchReviewsData(resortId); // Fetch reviews for the resort
            } else {
                console.log("No resort associated with the user");
                document.getElementById('userResort').innerText = "No resort assigned";
            }
        } else {
            console.log("No user data found");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// Fetch resort details and update overview
async function fetchResortDetails(resortId) {
    try {
        const reviewsRef = ref(database, `reviews/details`);
        const snapshot = await get(reviewsRef);
        if (snapshot.exists()) {
            const reviewsData = snapshot.val();
            const resortDetails = reviewsData[resortId];
            if (resortDetails) {
                const resortName = resortDetails.name || "Resort Name";
                const resortLocation = resortDetails.location || "Location not provided";
                const reviewCount = resortDetails.review_count || 0;

                document.getElementById('userResort').innerText = `${resortName} - ${resortLocation}`;
                document.getElementById('reviewCount').innerText = `Total Reviews: ${reviewCount}`;
            }
        }
    } catch (error) {
        console.error("Error fetching resort data:", error);
        document.getElementById('userResort').innerText = "Error loading resort data";
    }
}

// Fetch and process review data for sentiment and keywords (with year-wise trend)
async function fetchReviewsData(resortId) {
    try {
        const reviewsRef = ref(database, `reviews/${resortId}`);
        const snapshot = await get(reviewsRef);
        if (snapshot.exists()) {
            const reviewsData = snapshot.val();

            // Initialize an object to hold sentiment counts by year (2019-2024)
            const sentimentByYear = {
                2019: { positive: 0, neutral: 0, negative: 0 },
                2020: { positive: 0, neutral: 0, negative: 0 },
                2021: { positive: 0, neutral: 0, negative: 0 },
                2022: { positive: 0, neutral: 0, negative: 0 },
                2023: { positive: 0, neutral: 0, negative: 0 },
                2024: { positive: 0, neutral: 0, negative: 0 }
            };

            const keywordsCount = { positive: {}, negative: {} };
            let totalReviews = 0;

            // Loop through reviews and calculate sentiment and keywords
            for (let key in reviewsData) {
                if (key.startsWith('review_')) {
                    totalReviews++;
                    const review = reviewsData[key];
                    const rating = review.rating;
                    const comment = review.comments;
                    const timestamp = new Date(review.time * 1000); // Convert timestamp (in seconds) to milliseconds
                    const reviewYear = timestamp.getFullYear();

                    // Categorize sentiment based on rating (5 = positive, 3 = neutral, 1-2 = negative)
                    if (reviewYear >= 2019 && reviewYear <= 2024) {
                        if (rating === 5) sentimentByYear[reviewYear].positive++;
                        else if (rating === 3) sentimentByYear[reviewYear].neutral++;
                        else if (rating <= 2) sentimentByYear[reviewYear].negative++;
                    }

                    // Extract keywords from review comment
                    const words = comment.split(/\s+/);
                    words.forEach(word => {
                        word = word.toLowerCase().replace(/\W/g, ''); // Remove non-word characters
                        if (word.length > 3 && !stopWords.has(word)) { // Ignore stop words
                            if (rating === 5) {
                                keywordsCount.positive[word] = (keywordsCount.positive[word] || 0) + 1;
                            } else if (rating <= 2) {
                                keywordsCount.negative[word] = (keywordsCount.negative[word] || 0) + 1;
                            }
                        }
                    });
                }
            }

            // Prepare data for sentiment trend chart (positive, neutral, negative counts per year)
            const years = [2019, 2020, 2021, 2022, 2023, 2024];
            const sentimentData = years.map(year => ({
                year,
                positive: sentimentByYear[year].positive,
                neutral: sentimentByYear[year].neutral,
                negative: sentimentByYear[year].negative
            }));

            // Update the overview with counts (total reviews, sentiment by year)
            const positiveReviews = sentimentData.reduce((sum, data) => sum + data.positive, 0);
            const neutralReviews = sentimentData.reduce((sum, data) => sum + data.neutral, 0);
            const negativeReviews = sentimentData.reduce((sum, data) => sum + data.negative, 0);

            updateOverview(totalReviews, positiveReviews, neutralReviews, negativeReviews);

            // Render sentiment trend chart and top keywords chart
            renderSentimentTrendChart(sentimentData);
            renderTopKeywordsChart(keywordsCount);
        }
    } catch (error) {
        console.error("Error fetching review data:", error);
    }
}

// Update overview (total reviews, positive, neutral, negative counts)
function updateOverview(totalReviews, positiveReviews, neutralReviews, negativeReviews) {
    document.getElementById('total-reviews').innerText = totalReviews;
    document.getElementById('positive-percentage').innerText = positiveReviews;
    document.getElementById('neutral-percentage').innerText = neutralReviews;
    document.getElementById('negative-percentage').innerText = negativeReviews;
}

// Render the sentiment trend chart (Chart.js)
function renderSentimentTrendChart(sentimentData) {
    const ctx = document.getElementById('sentimentTrendChart').getContext('2d');

    // Ensure sentimentData is complete and valid
    if (sentimentData.some(data => data.positive === undefined || data.neutral === undefined || data.negative === undefined)) {
        console.error("Sentiment data is incomplete", sentimentData);
        return;
    }

    new Chart(ctx, {
        type: 'line',
        data: {
          labels: sentimentData.map(data => data.year), // X-axis labels (years)
          datasets: [
            {
              data: sentimentData.map(data => data.positive),
              borderColor: 'green',
              backgroundColor: 'rgba(87, 238, 87, 0.2)',
              fill: true
            },
            {
              data: sentimentData.map(data => data.neutral),
              borderColor: 'yellow',
              backgroundColor: 'rgba(255, 255, 0, 0.2)',
              fill: true
            },
            {
              data: sentimentData.map(data => data.negative),
              borderColor: 'red',
              backgroundColor: 'rgba(255, 0, 0, 0.2)',
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            legend: {
              display: false // Disable the legend
            },
            tooltip: {
              enabled: true,
              intersect: false,
              displayColors: false,
              callbacks: {
                label: function(tooltipItem) {
                  return tooltipItem.dataset.label + ': ' + tooltipItem.raw.toFixed(2); // Display tooltip with two decimal points
                }
              }
            }
          }
        }
      });
      
      
      
}

// Function to render word cloud with minimum 2 repeated words
function renderTopKeywordsChart(keywordsCount) {
    const positiveKeywords = Object.keys(keywordsCount.positive)
      .filter(keyword => keywordsCount.positive[keyword] >= 2) // Filter words with at least 2 occurrences
      .map(keyword => [keyword, keywordsCount.positive[keyword]]);
  
    const negativeKeywords = Object.keys(keywordsCount.negative)
      .filter(keyword => keywordsCount.negative[keyword] >= 2) // Filter words with at least 2 occurrences
      .map(keyword => [keyword, keywordsCount.negative[keyword]]);
  
    const allKeywords = [...positiveKeywords, ...negativeKeywords];
  
    WordCloud(document.getElementById('wordCloud'), {
      list: allKeywords,
      gridSize: 10,
      weightFactor: 10,
      fontFamily: 'Arial, sans-serif',
      color: function(word, weight) {
        const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#F1C40F'];
        return colors[Math.floor(Math.random() * colors.length)];
      },
      backgroundColor: '#ffffff'
    });
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
        sections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none'; // Hide all sections by default
        });
        navItems.forEach(item => item.classList.remove('active'));

        // Activate the target section
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block'; // Show only the active section
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

        // Disable scrolling when in the "Sentiment Analysis" tab
        if (targetId === 'sentiment-analysis') {
            document.body.style.overflow = 'hidden'; // Disable scrolling for the body
        } else {
            document.body.style.overflow = ''; // Enable scrolling for other tabs
        }
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





// account settings
document.addEventListener('DOMContentLoaded', () => {
    const accountSettingsModal = document.getElementById('accountSettingsModal');
    const openAccountSettings = document.getElementById('openAccountSettings');
    const closeAccountSettings = document.getElementById('closeAccountSettings');
    const resortNameDisplay = document.getElementById('resortNameDisplay');
    const deleteAccountButton = document.getElementById('deleteAccountButton');

    // Open Account Settings Modal
    if (openAccountSettings) {
        openAccountSettings.addEventListener('click', async () => {
            accountSettingsModal.style.display = 'block';

            const user = auth.currentUser;
            if (user) {
                // Get the user's resort ID
                const userRef = ref(database, `users/${user.uid}`);
                const userSnapshot = await get(userRef);

                if (userSnapshot.exists()) {
                    const resortId = userSnapshot.val().resort;

                    // Fetch resort details from the reviews branch
                    const resortRef = ref(database, `reviews/${resortId}/details`);
                    const resortSnapshot = await get(resortRef);

                    if (resortSnapshot.exists()) {
                        const resortData = resortSnapshot.val();
                        resortNameDisplay.textContent = resortData.name || "Not Provided";
                    } else {
                        resortNameDisplay.textContent = "Resort details not found.";
                    }
                } else {
                    resortNameDisplay.textContent = "User data not found.";
                }
            } else {
                resortNameDisplay.textContent = "User not authenticated.";
            }
        });
    }

    // Close Account Settings Modal
    if (closeAccountSettings) {
        closeAccountSettings.addEventListener('click', () => {
            accountSettingsModal.style.display = 'none';
        });
    }

    // Close Modal on Outside Click
    if (accountSettingsModal) {
        window.addEventListener('click', (event) => {
            if (event.target === accountSettingsModal) {
                accountSettingsModal.style.display = 'none';
            }
        });
    }

    // Delete Account Button Logic (if required)
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', async () => {
            if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                const user = auth.currentUser;
                if (user) {
                    try {
                        // Reauthenticate the user if needed (using the modular SDK)
                        const credential = EmailAuthProvider.credential(
                            user.email,
                            prompt("Enter your password to confirm account deletion")
                        );
                        await reauthenticateWithCredential(user, credential);

                        // Now delete the user from Firebase Auth and the database
                        const userRef = ref(database, `users/${user.uid}`);
                        await remove(userRef);
                        await user.delete();

                        alert("Account deleted successfully.");
                        window.location.href = '/';
                    } catch (error) {
                        console.error("Error deleting account:", error);
                        alert("Failed to delete account: " + error.message);
                    }
                } else {
                    alert("User not authenticated.");
                }
            }
        });
    }


});


// Firebase Configuration and Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

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
const db = getDatabase(app);  // Ensure db is initialized here


// Define the stop words list (common words and numbers)
const stopWords = [
    "the", "this", "a", "an", "us", "i", "it", "is", "to", "for", "and", "on", "at", "with", "by", "of", "be", "in", "as", "that", "are", "from", "or", "was", "were", "but", "which", "when", "how", "you", "your", "ours", "he", "she", "they",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"
];

// Listen for DOMContentLoaded event
window.addEventListener('DOMContentLoaded', () => {
    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is logged in, fetch user data
            fetchUserData(user.uid);
        } else {
            // User is not logged in, redirect to login page
            window.location.href = "/login";
        }
    });
});

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



// Update overview (total reviews, positive, neutral, negative counts)
function updateOverview(totalReviews, positiveReviews, neutralReviews, negativeReviews) {
    document.getElementById('total-reviews').innerText = totalReviews;
    document.getElementById('positive-percentage').innerText = positiveReviews;
    document.getElementById('neutral-percentage').innerText = neutralReviews;
    document.getElementById('negative-percentage').innerText = negativeReviews;
}
// Define specific positive and negative words
const specificPositiveWords = [
    "excellent", "amazing", "fantastic", "great", "wonderful", "perfect", 
    "safe", "spacious", "relax", "playground", "serene", "free", "no corkage", 
    "affordable", "powdery", "white sand", "beautiful", "calm", "romantic", 
    "clean", "accommodating", "complete amenities"
];

const specificNegativeWords = [
    "bad", "terrible", "horrible", "poor", "awful", "no rooms", 
    "limited", "improve", "baby resort", "rocky", "price increase",
    "needs work", "suggest improve", "problem", "issue"
];

// Define specific negative phrases (added this part)
const specificNegativePhrases = [
    "price increase", "needs work", "poor quality", "service lacks", "too expensive", "no rooms"
];

// Function to remove stop words from the comment
function removeStopWords(comment) {
    const cleanedComment = comment.replace(/[.,!?;()]/g, '');
    const words = cleanedComment.split(" ");
    return words.filter(word => !stopWords.includes(word.toLowerCase())).join(" ");
}

// Function to extract aspects data from reviews and filter specific words or phrases
function extractAspectsData(resortData) {
    const csvData = resortData?.csvData || {};
    const positiveKeywords = {};
    const negativeKeywords = {};

    for (const key in csvData) {
        const comment = csvData[key].Comments || "";
        const sentiment = csvData[key]["Predicted Sentiment"];

        // Remove stop words and punctuation from the comment
        const cleanedComment = removeStopWords(comment);

        // Normalize to lowercase to ensure case-insensitive matching
        const words = cleanedComment.toLowerCase().split(" ");

        // Filter positive words
        if (sentiment === "Positive") {
            words.forEach((word) => {
                if (specificPositiveWords.includes(word)) {
                    positiveKeywords[word] = (positiveKeywords[word] || 0) + 1;
                }
            });
        } 
        // Filter negative words and phrases
        else if (sentiment === "Negative" || sentiment === "Neutral") {
            // Check for single negative words
            words.forEach((word) => {
                if (specificNegativeWords.includes(word)) {
                    negativeKeywords[word] = (negativeKeywords[word] || 0) + 1;
                }
            });

            // Check for multi-word negative phrases
            for (let i = 0; i < words.length - 1; i++) {
                const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
                if (specificNegativePhrases.includes(twoWordPhrase)) {
                    negativeKeywords[twoWordPhrase] = (negativeKeywords[twoWordPhrase] || 0) + 1;
                }
            }
        }
    }

    console.log("Positive Keywords:", positiveKeywords); // Debugging statement
    console.log("Negative Keywords:", negativeKeywords); // Debugging statement

    return { positiveKeywords, negativeKeywords };
}

// Function to render sentiment breakdown pie chart (Chart.js)
function renderSentimentBreakdownChart(positiveReviews, neutralReviews, negativeReviews, totalReviews) {
    new Chart(document.getElementById('sentimentBreakdownChart'), {
        type: 'pie',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                label: 'Sentiment Breakdown',
                data: [positiveReviews, neutralReviews, negativeReviews],
                backgroundColor: ['green', 'yellow', 'red'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => {
                            const label = tooltipItem.label || '';
                            const value = tooltipItem.raw || 0;

                            // Return detailed label with percentage
                            const percentage = ((value / totalReviews) * 100).toFixed(1);
                            return `${label}: ${value} reviews (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Function to render aspects in bar chart
function renderPositiveAspectsChart(positiveKeywords) {
    const sortedPositiveKeywords = Object.entries(positiveKeywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const keywords = sortedPositiveKeywords.map(([keyword]) => keyword);
    const counts = sortedPositiveKeywords.map(([_, count]) => count);

    new Chart(document.getElementById('positiveAspectsChart'), {
        type: 'bar',
        data: {
            labels: keywords,
            datasets: [{
                label: 'Top Positive Aspects',
                data: counts,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y', // Horizontal bar chart
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Aspect'
                    }
                }
            }
        }
    });
}

// Function to render negative aspects in bar chart
function renderNegativeAspectsChart(negativeKeywords) {
    const sortedNegativeKeywords = Object.entries(negativeKeywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sortedNegativeKeywords.length === 0) {
        console.log("No negative aspects to render!"); // Debugging statement
    }

    const keywords = sortedNegativeKeywords.map(([keyword]) => keyword);
    const counts = sortedNegativeKeywords.map(([_, count]) => count);

    new Chart(document.getElementById('negativeAspectsChart'), {
        type: 'bar',
        data: {
            labels: keywords,
            datasets: [{
                label: 'Top Negative Aspects',
                data: counts,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y', // Horizontal bar chart
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Aspect'
                    }
                }
            }
        }
    });
}

// Function to extract sentiment data from CSV
function extractSentimentData(resortData) {
    const csvData = resortData?.csvData || {};
    let positiveReviews = 0;
    let neutralReviews = 0;
    let negativeReviews = 0;
    let totalReviews = 0;

    for (const key in csvData) {
        const data = csvData[key];
        const predictedSentiment = data["Predicted Sentiment"];

        if (predictedSentiment === "Positive") {
            positiveReviews++;
        } else if (predictedSentiment === "Neutral") {
            neutralReviews++;
        } else if (predictedSentiment === "Negative") {
            negativeReviews++;
        }
        totalReviews++;
    }

    return { positiveReviews, neutralReviews, negativeReviews, totalReviews };
}


// Fetch and process review data for sentiment and aspects
async function fetchReviewsData(resortId) {
    try {
        const reviewsRef = ref(db, `reviews/${resortId}`);
        const snapshot = await get(reviewsRef);
        if (snapshot.exists()) {
            const resortData = snapshot.val();

            // Extract sentiment data from the CSV data
            const { positiveReviews, neutralReviews, negativeReviews, totalReviews } = extractSentimentData(resortData);

            // Update the overview with counts
            updateOverview(totalReviews, positiveReviews, neutralReviews, negativeReviews);

            // Render sentiment breakdown chart
            renderSentimentBreakdownChart(positiveReviews, neutralReviews, negativeReviews, totalReviews);

            // Extract aspect data for positive and negative aspects
            const { positiveKeywords, negativeKeywords } = extractAspectsData(resortData);

            // Render charts for positive and negative aspects
            renderPositiveAspectsChart(positiveKeywords);
            renderNegativeAspectsChart(negativeKeywords);
        }
    } catch (error) {
        console.error("Error fetching review data:", error);
    }
}




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


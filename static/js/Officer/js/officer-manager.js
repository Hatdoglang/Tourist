// Firebase Configuration and Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDbNXaBjr2FVNN3nC4W8CUa9DlQwR2D87s",
    authDomain: "csas-158fc.firebaseapp.com",
    databaseURL: "https://csas-158fc-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "csas-158fc",
    storageBucket: "csas-158fc.appspot.com",
    messagingSenderId: "763041820862",
    appId: "1:763041820862:web:c11981b07960e91ece6eef",
    measurementId: "G-26BMZST2LE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOMContentLoaded Event
window.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Fetch user data and all reviews
            fetchUserData(user.uid);
        } else {
            // Redirect to login if not logged in
            window.location.href = "/login";
        }
    });
});

// Fetch user data
async function fetchUserData(userId) {
    try {
        const userRef = ref(database, 'users/' + userId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const userName = userData.name || "Guest"; // Default to "Guest"
            document.getElementById('userName').innerText = userName;

            // Fetch and display all reviews globally
            fetchReviewsData();
        } else {
            console.log("No user data found");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// Fetch all reviews globally
async function fetchReviewsData() {
    try {
        const reviewsRef = ref(database, 'reviews');
        const snapshot = await get(reviewsRef);
        if (snapshot.exists()) {
            const reviews = snapshot.val();
            displayReviews(reviews);
        } else {
            console.log("No reviews found");
        }
    } catch (error) {
        console.error("Error fetching reviews:", error);
    }
}

// Display reviews in the UI
function displayReviews(reviews) {
    console.log("All Reviews:", reviews);

    // Example: Count total reviews
    const totalReviews = Object.keys(reviews).length;
    document.getElementById('total-reviews').innerText = totalReviews;
    
    // Add custom logic to display reviews (e.g., charts, tables)
}



/**
 * Prepares the word cloud data from the list of aspects.
 * @param {Array} aspects - The list of aspects (positive or negative) from reviews.
 * @returns {Array} List of words and their frequency, ready for word cloud.
 */
function prepareWordCloudData(aspects) {
    const wordFrequency = {};

    aspects.forEach(aspect => {
        // Split each aspect into words and count frequency
        aspect.split(' ').forEach(word => {
            const lowerWord = word.toLowerCase().trim();
            if (lowerWord.length > 2) {
                wordFrequency[lowerWord] = (wordFrequency[lowerWord] || 0) + 1;
            }
        });
    });

    // Convert the word frequency object into an array of [word, frequency]
    return Object.keys(wordFrequency).map(word => [word, wordFrequency[word]]);
}

// Call this function in your review sentiment analysis logic
function analyzeReviewSentiment(review, sentimentData) {
    const positiveWords = ['good', 'excellent', 'great', 'love', 'best'];
    const negativeWords = ['bad', 'worst', 'hate', 'disappointed'];

    const sentiment = {
        positive: 0,
        negative: 0
    };

    if (review.comments && typeof review.comments === 'string') {
        positiveWords.forEach(word => {
            if (review.comments.toLowerCase().includes(word)) sentiment.positive += 1;
        });

        negativeWords.forEach(word => {
            if (review.comments.toLowerCase().includes(word)) sentiment.negative += 1;
        });

        if (sentiment.positive > sentiment.negative) {
            sentimentData.positive += 1;
            updateAspectCount(sentimentData.positiveAspects, review.comments, 'positive');
        } else if (sentiment.negative > sentiment.positive) {
            sentimentData.negative += 1;
            updateAspectCount(sentimentData.negativeAspects, review.comments, 'negative');
        } else {
            sentimentData.neutral += 1;
        }
    } else {
        console.log('No comments found for review:', review);
    }
}

/**
 * Updates the positive or negative aspect counts based on comments.
 * @param {Array} aspects - Array of aspects for positive or negative sentiment.
 * @param {string} comment - The review comment.
 * @param {string} sentiment - 'positive' or 'negative'.
 */
function updateAspectCount(aspects, comment, sentiment) {
    // Split the comment into words and count aspects for positive/negative sentiment
    comment.split(' ').forEach(word => {
        const lowerWord = word.toLowerCase().trim();
        if (lowerWord.length > 2) {
            aspects.push(lowerWord); // Add the word to the corresponding sentiment aspect list
        }
    });
}



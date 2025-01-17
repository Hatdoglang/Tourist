import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

window.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            fetchUserData(user.uid);
        } else {
            window.location.href = "/login";
        }
    });
});

/**
 * Fetches the user data from Firebase when the user is logged in.
 * @param {string} userId - The user ID of the logged-in user.
 */
async function fetchUserData(userId) {
    try {
        const userRef = ref(database, 'users/' + userId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            document.getElementById('userName').innerText = userData.name || "Guest";
            fetchReviewsData();
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

/**
 * Fetches the reviews data from Firebase for all resorts.
 * It then calculates the total rating and converts it into percentage.
 */
async function fetchReviewsData() {
    try {
        const reviewsRef = ref(database, 'reviews');
        const snapshot = await get(reviewsRef);
        if (snapshot.exists()) {
            const reviews = snapshot.val();
            displayReviews(reviews);
        }
    } catch (error) {
        console.error("Error fetching reviews:", error);
    }
}

/**
 * Displays the reviews for all resorts, calculates total rating, and converts it into percentage.
 * @param {Object} reviews - The reviews data for all resorts.
 */
function displayReviews(reviews) {
    console.log("All Reviews:", reviews);

    const resortRatings = [];

    // Iterate over each resort and calculate total rating and percentage
    Object.keys(reviews).forEach(resortId => {
        const resortDetails = reviews[resortId].details;
        console.log("Resort ID:", resortId);
        console.log("Resort Details:", resortDetails);

        const totalRating = Object.keys(reviews[resortId])
            .filter(reviewKey => reviewKey.startsWith("review_"))
            .reduce((acc, reviewKey) => {
                const review = reviews[resortId][reviewKey];
                // Ensure review.rating is a valid number
                if (review.rating != null && !isNaN(review.rating)) {
                    return acc + review.rating;
                }
                return acc;
            }, 0);

        const reviewCount = resortDetails.review_count || 0;

        // Prevent division by zero (empty reviews)
        if (reviewCount > 0) {
            const maxRating = 5 * reviewCount; // Max possible rating
            const percentage = (totalRating / maxRating) * 100;

            resortRatings.push({
                resortId,
                name: resortDetails.name,
                percentage,
                reviewCount,
                totalRating
            });
        } else {
            console.log(`No reviews for resort ID: ${resortId}`);
        }
    });

    // Sort resorts by rating percentage
    resortRatings.sort((a, b) => b.percentage - a.percentage);

    // Display the top and low performing resorts
    const topPerforming = resortRatings.slice(0, 1);
    const lowPerforming = resortRatings.slice(-1);

    displayTopPerformingResorts(topPerforming);
    displayLowPerformingResorts(lowPerforming);
}

/**
 * Displays the top-performing resorts on the page.
 * Resorts are shown in green with their percentage rating.
 * @param {Array} resorts - Array of top-performing resorts.
 */
function displayTopPerformingResorts(resorts) {
    const container = document.getElementById('topPerformingResorts');
    container.innerHTML = "";
    resorts.forEach(resort => {
        const resortElement = document.createElement('div');
        resortElement.innerText = `${resort.name}: ${resort.percentage.toFixed(2)}%`; // Display percentage
        resortElement.style.color = "green";
        container.appendChild(resortElement);
    });
}

/**
 * Displays the low-performing resorts on the page.
 * Resorts are shown in red with their percentage rating.
 * @param {Array} resorts - Array of low-performing resorts.
 */
function displayLowPerformingResorts(resorts) {
    const container = document.getElementById('lowPerformingResorts');
    container.innerHTML = "";
    resorts.forEach(resort => {
        const resortElement = document.createElement('div');
        resortElement.innerText = `${resort.name}: ${resort.percentage.toFixed(2)}%`; // Display percentage
        resortElement.style.color = "red";
        container.appendChild(resortElement);
    });
}

function analyzeReviewSentiment(review, sentimentData) {
    // Example sentiment analysis (you can replace this with a real sentiment analysis library or API)
    const positiveWords = ['good', 'excellent', 'great', 'love', 'best'];
    const negativeWords = ['bad', 'worst', 'hate', 'disappointed'];

    const sentiment = {
        positive: 0,
        negative: 0
    };

    // Check if comments exist
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


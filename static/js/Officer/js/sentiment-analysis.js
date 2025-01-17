import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbNXaBjr2FVNN3nC4W8CUa9DlQwR2D87s",
  authDomain: "csas-158fc.firebaseapp.com",
  databaseURL: "https://csas-158fc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "csas-158fc",
  storageBucket: "csas-158fc.appspot.com",
  messagingSenderId: "763041820862",
  appId: "1:763041820862:web:c11981b07960e91ece6eef",
  measurementId: "G-26BMZST2LE",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase();

async function fetchAndProcessData() {
  try {
    const reviewsRef = ref(database, "reviews");
    const snapshot = await get(reviewsRef);

    if (!snapshot.exists()) {
      console.error("No reviews data found!");
      return;
    }

    const reviewsData = snapshot.val();
    console.log("Reviews Data:", reviewsData); // Log the entire reviews data

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    const trendData = {}; // Format: { "YYYY-MM": { positive: 0, negative: 0, neutral: 0 } }

    const allReviewIDs = [];

    // Loop through each location
    for (const locationKey in reviewsData) {
      const locationDetails = reviewsData[locationKey]?.details;
      console.log("Location Details:", locationDetails); // Log each location's details

      // Loop through all reviews (review_0, review_1, ...)
      for (const reviewKey in reviewsData[locationKey]) {
        if (reviewKey.startsWith("review_")) {
          const review = reviewsData[locationKey][reviewKey];
          console.log("Review:", review); // Log each individual review

          allReviewIDs.push(reviewKey);

          if (review?.rating !== undefined && review?.time !== undefined) {
            // Categorize sentiment based on rating
            if (review.rating >= 4) {
              sentimentCounts.positive++;
            } else if (review.rating <= 2) {
              sentimentCounts.negative++;
            } else {
              sentimentCounts.neutral++;
            }

            // Group by year-month for trend analysis
            const reviewDate = new Date(review.time * 1000); // Convert UNIX timestamp to JS Date
            const yearMonth = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, "0")}`;
            if (!trendData[yearMonth]) {
              trendData[yearMonth] = { positive: 0, negative: 0, neutral: 0 };
            }
            if (review.rating >= 4) {
              trendData[yearMonth].positive++;
            } else if (review.rating <= 2) {
              trendData[yearMonth].negative++;
            } else {
              trendData[yearMonth].neutral++;
            }
          }
        }
      }
    }

    console.log("All Review IDs:", allReviewIDs); // Log all combined review IDs
    console.log("Sentiment Counts:", sentimentCounts); // Log sentiment counts
    console.log("Trend Data:", trendData); // Log trend data

    // Render charts
    renderCharts(sentimentCounts, trendData);
  } catch (error) {
    console.error("Error fetching reviews:", error);
  }
}

function renderCharts(sentimentCounts, trendData) {
  // Render Pie Chart for Sentiment Breakdown
  const sentimentBreakdownCtx = document.getElementById("sentimentBreakdownChart").getContext("2d");
  new Chart(sentimentBreakdownCtx, {
    type: "pie",
    data: {
      labels: ["Positive", "Negative", "Neutral"],
      datasets: [{
        data: [sentimentCounts.positive, sentimentCounts.negative, sentimentCounts.neutral],
        backgroundColor: ["#4caf50", "#f44336", "#ff9800"],
      }],
    },
  });

  // Render Line Chart for Trend Analysis
  const trendAnalysisCtx = document.getElementById("trendAnalysisChart").getContext("2d");
  const labels = Object.keys(trendData).sort(); // Sort by year-month
  const positiveData = labels.map(label => trendData[label].positive || 0);
  const negativeData = labels.map(label => trendData[label].negative || 0);
  const neutralData = labels.map(label => trendData[label].neutral || 0);

  new Chart(trendAnalysisCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Positive",
          data: positiveData,
          borderColor: "#4caf50",
          fill: false,
        },
        {
          label: "Negative",
          data: negativeData,
          borderColor: "#f44336",
          fill: false,
        },
        {
          label: "Neutral",
          data: neutralData,
          borderColor: "#ff9800",
          fill: false,
        },
      ],
    },
  });
}


// Fetch and process data
fetchAndProcessData();

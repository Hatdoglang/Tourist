import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// Firebase Configuration
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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let sentimentChartInstance = null;
let feedbackChartInstance = null;

// Utility Function to Extract Comments and Sentiment from CSV Data
function extractCSVData(resortData) {
    const csvData = resortData?.csvData || {};
    const comments = [];
    const trueSentiment = [];
    const predictedSentiment = [];

    // Extracting comments and sentiments from the CSV data
    for (const key in csvData) {
        const data = csvData[key];
        if (data.Comments) {
            comments.push(data.Comments);
            trueSentiment.push(data["True Sentiment"]);
            predictedSentiment.push(data["Predicted Sentiment"]);
        }
    }

    return { comments, trueSentiment, predictedSentiment };
}

// Sentiment Analysis for Pie Chart based on Predicted Sentiment
function analyzeSentiment(predictedSentiment) {
    const positiveCount = predictedSentiment.filter(sentiment => sentiment === "Positive").length;
    const negativeCount = predictedSentiment.filter(sentiment => sentiment === "Negative").length;
    const neutralCount = predictedSentiment.filter(sentiment => sentiment === "Neutral").length;

    const total = positiveCount + negativeCount + neutralCount;
    return {
        labels: ["Positive", "Negative", "Neutral"],
        datasets: [{
            label: "Sentiments",
            data: total ? [
                ((positiveCount / total) * 100).toFixed(1),
                ((negativeCount / total) * 100).toFixed(1),
                ((neutralCount / total) * 100).toFixed(1)
            ] : [0, 0, 0],  // Add neutral count
            backgroundColor: ["#4caf50", "#f44336", "#ffeb3b"]  // Green, Red, Yellow for each sentiment
        }]
    };
}
// Aspect Analysis for Grouped Bar Chart
function analyzeAspectsForBarChart(comments) {
    const aspects = ["cleanliness", "food", "service"];
    const positiveData = [];
    const negativeData = [];
    const neutralData = [];

    aspects.forEach(aspect => {
        let positive = 0;
        let negative = 0;
        let neutral = 0;

        comments.forEach(comment => {
            const lowerComment = comment.toLowerCase();
            if (lowerComment.includes(aspect)) {
                if (lowerComment.includes("good") || lowerComment.includes("great")) {
                    positive++;
                } else if (lowerComment.includes("bad") || lowerComment.includes("poor")) {
                    negative++;
                } else {
                    neutral++; // For comments that aren't distinctly positive or negative
                }
            }
        });

        positiveData.push(positive);
        negativeData.push(negative);
        neutralData.push(neutral); // Add neutral count for each aspect
    });

    return {
        labels: aspects.map(a => a.charAt(0).toUpperCase() + a.slice(1)),
        datasets: [
            {
                label: "Positive",
                data: positiveData,
                backgroundColor: "#4caf50"
            },
            {
                label: "Negative",
                data: negativeData,
                backgroundColor: "#f44336"
            },
            {
                label: "Neutral",
                data: neutralData,
                backgroundColor: "#ffeb3b" // Yellow for neutral feedback
            }
        ]
    };
}

// Update Charts
function updateChart(instance, chartId, data, chartType) {
    if (instance) instance.destroy(); // Destroy existing chart to avoid duplication
    const ctx = document.getElementById(chartId).getContext("2d");
    return new Chart(ctx, {
        type: chartType,
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: { position: "top" },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            },
            scales: chartType === "bar" ? {
                x: { title: { display: true, text: "Aspect" } },
                y: { title: { display: true, text: "Count" } }
            } : {}
        }
    });
}


// On DOM Content Loaded
document.addEventListener("DOMContentLoaded", async () => {
    const dropdown = document.getElementById("resortDropdown");
    const reviewsRef = ref(db, "reviews");

    try {
        const snapshot = await get(reviewsRef);
        if (snapshot.exists()) {
            const resorts = snapshot.val();
            for (const key in resorts) {
                const resortName = resorts[key]?.details?.name || "Unnamed Resort";
                const option = document.createElement("option");
                option.value = key;
                option.textContent = resortName;
                dropdown.appendChild(option);
            }
        } else {
            console.error("No data available.");
        }
    } catch (error) {
        console.error("Error fetching reviews:", error);
    }

    // Resort Dropdown Change Event
    dropdown.addEventListener("change", async () => {
        const selectedKey = dropdown.value;
        if (!selectedKey) return;

        const resortRef = ref(db, `reviews/${selectedKey}`);
        try {
            const snapshot = await get(resortRef);
            if (snapshot.exists()) {
                const resortData = snapshot.val();
                const { comments, trueSentiment, predictedSentiment } = extractCSVData(resortData);

                // Update Sentiment Pie Chart
                const sentimentData = analyzeSentiment(predictedSentiment);
                sentimentChartInstance = updateChart(sentimentChartInstance, "sentimentChart", sentimentData, "pie");

                // Update Feedback Grouped Bar Chart
                const feedbackData = analyzeAspectsForBarChart(comments);
                feedbackChartInstance = updateChart(feedbackChartInstance, "feedbackChart", feedbackData, "bar");
            } else {
                console.error("No data found for the selected resort.");
            }
        } catch (error) {
            console.error("Error fetching resort details:", error);
        }
    });
});




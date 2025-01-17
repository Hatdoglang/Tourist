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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// List of common stop words
const stopWords = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
  "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
  "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are",
  "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the",
  "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against",
  "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out",
  "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how",
  "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own",
  "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"
]);

// List of positive and negative words
const positiveWords = ['service', 'cleanliness', 'location', 'value for money', 'ambiance', 'staff', 'comfortable'];
const negativeWords = ['food quality', 'room size', 'check-in process', 'noise', 'parking', 'wait time'];

// Function to fetch and process all reviews
async function fetchAndAnalyzeAllReviews() {
  try {
    const reviewsRef = ref(database, 'reviews');
    const snapshot = await get(reviewsRef);

    if (snapshot.exists()) {
      const reviewsData = snapshot.val();
      const sentimentData = {
        positive: 0,
        negative: 0,
        neutral: 0,
        positiveAspects: {},
        negativeAspects: {},
        positiveComments: [],
        negativeComments: []
      };

      // Analyze each review
      for (const placeId in reviewsData) {
        const placeReviews = reviewsData[placeId];
        for (const reviewKey in placeReviews) {
          if (reviewKey.startsWith('review_')) {
            const review = placeReviews[reviewKey];
            analyzeReviewSentiment(review, sentimentData);
          }
        }
      }

      // Display results
      displaySentimentCharts(sentimentData);
      displayComments(sentimentData);
    } else {
      console.log('No data available');
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
  }
}

// Analyze review sentiment
function analyzeReviewSentiment(review, sentimentData) {
  const sentiment = { positive: 0, negative: 0 };
  const positiveAspects = sentimentData.positiveAspects || {};
  const negativeAspects = sentimentData.negativeAspects || {};

  if (review.comments && typeof review.comments === 'string') {
    const filteredComments = filterStopWords(review.comments);

    // Count positive and negative words
    positiveWords.forEach(word => {
      if (filteredComments.includes(word)) {
        sentiment.positive++;
        updateAspectCount(positiveAspects, word);
      }
    });
    negativeWords.forEach(word => {
      if (filteredComments.includes(word)) {
        sentiment.negative++;
        updateAspectCount(negativeAspects, word);
      }
    });

    if (sentiment.positive > sentiment.negative) {
      sentimentData.positive++;
      sentimentData.positiveComments.push(review.comments);
    } else if (sentiment.negative > sentiment.positive) {
      sentimentData.negative++;
      sentimentData.negativeComments.push(review.comments);
    } else {
      sentimentData.neutral++;
    }
  }
}

// Remove stop words from comments
function filterStopWords(comment) {
  return comment.split(' ').filter(word => !stopWords.has(word.toLowerCase())).join(' ');
}

// Update aspect count
function updateAspectCount(aspectObj, word) {
  if (!aspectObj[word]) {
    aspectObj[word] = 0;
  }
  aspectObj[word]++;
}

// Display sentiment charts with sidebar graph and hover effect
function displaySentimentCharts(sentimentData) {
  // Prepare data for positive and negative charts
  const positiveLabels = Object.keys(sentimentData.positiveAspects).slice(0, 5);
  const positiveData = Object.values(sentimentData.positiveAspects).slice(0, 5);
  const negativeLabels = Object.keys(sentimentData.negativeAspects).slice(0, 5);
  const negativeData = Object.values(sentimentData.negativeAspects).slice(0, 5);

  // Positive Aspects Chart
  const ctxPositive = document.getElementById('positiveAspectsChart').getContext('2d');
  new Chart(ctxPositive, {
    type: 'bar',
    data: {
      labels: positiveLabels,
      datasets: [{
        label: 'Top Positive Aspects',
        data: positiveData,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal bars (by setting the index axis to 'y')
      scales: {
        x: { display: false }, // Hide the X-axis to avoid numbers showing
        y: { beginAtZero: true }
      },
      plugins: {
        tooltip: { enabled: true, intersect: false, displayColors: false }, // Enable tooltips with hover effect
        legend: { display: false } // Hide legend
      }
    }
  });

  // Negative Aspects Chart
  const ctxNegative = document.getElementById('negativeAspectsChart').getContext('2d');
  new Chart(ctxNegative, {
    type: 'bar',
    data: {
      labels: negativeLabels,
      datasets: [{
        label: 'Top Negative Aspects',
        data: negativeData,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal bars (by setting the index axis to 'y')
      scales: {
        x: { display: false }, // Hide the X-axis to avoid numbers showing
        y: { beginAtZero: true }
      },
      plugins: {
        tooltip: { enabled: true, intersect: false, displayColors: false }, // Enable tooltips with hover effect
        legend: { display: false } // Hide legend
      }
    }
  });

  // Sidebar Graph
  const ctxSidebar = document.getElementById('sidebarGraph').getContext('2d');
  new Chart(ctxSidebar, {
    type: 'bar',
    data: {
      labels: ['Positive', 'Negative'],
      datasets: [{
        label: 'Sentiment Overview',
        data: [sentimentData.positive, sentimentData.negative],
        backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal bars (by setting the index axis to 'y')
      scales: {
        x: { display: false }, // Hide the X-axis to avoid numbers showing
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { display: false }, // Hide legend for sidebar graph
        tooltip: { enabled: true, intersect: false, displayColors: false } // Enable tooltips with hover effect
      }
    }
  });
}



// Display comments
function displayComments(sentimentData) {
  const positiveCommentsContainer = document.getElementById('positiveComments');
  const negativeCommentsContainer = document.getElementById('negativeComments');

  positiveCommentsContainer.innerHTML = '<h3>Positive Comments</h3>';
  sentimentData.positiveComments.forEach(comment => {
    const p = document.createElement('p');
    p.textContent = comment;
    positiveCommentsContainer.appendChild(p);
  });

  negativeCommentsContainer.innerHTML = '<h3>Negative Comments</h3>';
  sentimentData.negativeComments.forEach(comment => {
    const p = document.createElement('p');
    p.textContent = comment;
    negativeCommentsContainer.appendChild(p);
  });
}

// Fetch and analyze reviews
fetchAndAnalyzeAllReviews();

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

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

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Get modal and buttons
const requestModal = document.getElementById('requestModal');
const requestAccountButton = document.getElementById('requestAccountButton');
const closeModalButton = document.getElementById('closeModalButton');

// Open modal
requestAccountButton.addEventListener('click', () => {
    requestModal.style.display = 'block';
});

// Close modal
closeModalButton.addEventListener('click', () => {
    requestModal.style.display = 'none';
});

// Close modal when clicking outside the modal
window.addEventListener('click', (event) => {
    if (event.target === requestModal) {
        requestModal.style.display = 'none';
    }
});

// Form Submission Handler
document.getElementById('requestForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    // Collecting form data
    const data = {
        name: formData.get('name') || "No name provided",
        email: formData.get('email') || "No email provided",
        message: formData.get('message') || "No reason provided",
        timestamp: new Date().toISOString() // Add timestamp for sorting
    };

    try {
        // Push data to Firebase under the 'messages' directory
        await push(ref(db, 'messages'), data);

        alert('Your request has been submitted successfully!');
        e.target.reset(); // Reset the form
        requestModal.style.display = 'none'; // Close the modal
    } catch (error) {
        console.error('Error saving message:', error);
        alert('An error occurred while submitting your request. Please try again later.');
    }
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

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
const auth = getAuth(app);
const db = getDatabase(app);

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Firebase ID token for Flask login
        const idToken = await user.getIdToken();

        // Log the ID token in the browser console for debugging
        console.log("Firebase ID Token: ", idToken);

        // Send the ID token to the Flask backend for authentication
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'  // Correct content type
            },
            body: JSON.stringify({ id_token: idToken })  // Send data as JSON
        });

        // Check if response is ok (status 200)
        if (response.ok) {
            const data = await response.json();
            const role = data.role;

            // Redirect based on the user's role (only Resort Officer now)
            if (role === 'Tourism Officer') {
                window.location.href = "/resort-officer-dashboard";  // Redirect to the dashboard if role matches
            } else {
                alert('Role not recognized or invalid!');
            }
        } else {
            alert('Login failed: ' + response.statusText);
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert(error.message);
    }
});


// JavaScript for modal functionality
const contactDeveloperLink = document.getElementById('contactDeveloperLink');
const contactModal = document.getElementById('contactModal');
const closeModalButton = document.getElementById('closeModal');

// Show the modal when the 'Contact Developer' link is clicked
contactDeveloperLink.addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the link from navigating
    contactModal.style.display = 'block'; // Show the modal
});

// Close the modal when the 'Close' button is clicked
closeModalButton.addEventListener('click', function() {
    contactModal.style.display = 'none'; // Hide the modal
});

// Close the modal if the user clicks anywhere outside the modal content
window.addEventListener('click', function(event) {
    if (event.target === contactModal) {
        contactModal.style.display = 'none'; // Hide the modal if clicked outside
    }
});

// Handle the contact form submission
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get the data from the form
    const name = document.getElementById('name').value;
    const email = document.getElementById('modal-email').value;
    const message = document.getElementById('message').value;

    try {
        // Use a simple timestamp (in milliseconds) for the path
        const timestamp = Date.now();  // Get current timestamp in milliseconds
        const messageRef = ref(db, 'messages/' + timestamp);  // Use timestamp as the path
        await set(messageRef, {
            name: name,
            email: email,
            message: message,
            timestamp: new Date().toISOString()
        });

        alert('Your message has been sent successfully!');

        // Optionally, you can reset the form fields
        document.getElementById('contactForm').reset();
        contactModal.style.display = 'none';  // Close the modal after submission

    } catch (error) {
        console.error('Error sending message:', error);
        alert('There was an error sending your message. Please try again.');
    }
});

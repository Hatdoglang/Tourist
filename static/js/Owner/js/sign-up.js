import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
const firestore = getFirestore(app);  

const signupForm = document.getElementById('signup-form');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value; 
    const role = document.getElementById('role').value;

    // Check if passwords match
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        console.log("User created with ID:", userId);

        // Store additional user data in Firestore
        await setDoc(doc(firestore, 'Users', userId), {
            name: name,
            email: email,
            role: role,
            uid: userId  // Store the unique user ID
        });

        console.log("User data saved to Firestore.");

        // Fetch the user data after sign-up
        const userDoc = await getDoc(doc(firestore, 'Users', userId));
        if (userDoc.exists()) {
            const name = userDoc.data().name;
            console.log("User name fetched from Firestore: ", name);  // Log name fetched from Firestore
            // Save name to localStorage
            localStorage.setItem("resortOwnerName", name);
            console.log("User name saved to localStorage: ", localStorage.getItem("resortOwnerName"));  // Log name stored in localStorage
        } else {
            console.log("User data not found in Firestore!");
        }

        // Redirect user based on their role
        redirectToOnboarding(role);

    } catch (error) {
        console.error("Error signing up:", error);
        alert("Error signing up: " + error.message);
    }
});


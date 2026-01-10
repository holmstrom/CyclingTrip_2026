// Firebase Configuration
// Replace these values with your Firebase project credentials
// Get them from: https://console.firebase.google.com/ -> Project Settings -> Your apps

const firebaseConfig = {
    apiKey: "AIzaSyBH4fhgT5pmYpsTo7aLNddRBZuAGpr-uFg",
    authDomain: "cyclingtrip2026.firebaseapp.com",
    projectId: "cyclingtrip2026",
    storageBucket: "cyclingtrip2026.firebasestorage.app",
    messagingSenderId: "753177810906",
    appId: "1:753177810906:web:32af42ae9078ca53fad2e3",
    measurementId: "G-W2PRSY0PXV"
  };

// Initialize Firebase (only if Firebase SDK is loaded)
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    window.storage = firebase.storage();
} else {
    console.warn('Firebase SDK not loaded. Install from: https://firebase.google.com/docs/web/setup');
}


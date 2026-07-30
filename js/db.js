// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBJFbz-sis-_ucxV6OsIGh4U0cRD9n8wcg",
    authDomain: "filacero-3e291.firebaseapp.com",
    projectId: "filacero-3e291",
    storageBucket: "filacero-3e291.firebasestorage.app",
    messagingSenderId: "605661966094",
    appId: "1:605661966094:web:00c848ed951e24bf8e715f",
    measurementId: "G-QQESPPR2BH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
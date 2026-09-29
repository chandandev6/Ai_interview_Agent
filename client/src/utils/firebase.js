// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "aismartinterview-1dc3f.firebaseapp.com",
    projectId: "aismartinterview-1dc3f",
    storageBucket: "aismartinterview-1dc3f.firebasestorage.app",
    messagingSenderId: "315065879545",
    appId: "1:315065879545:web:9062e0d8f8b8d6fab54b28",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export { auth, provider };

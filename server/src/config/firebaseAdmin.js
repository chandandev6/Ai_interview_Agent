// Firebase Admin sirf ID token verify karne ke liye — iske liye service account ki zarurat nahi, projectId kaafi hai
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const app = getApps().length
    ? getApps()[0]
    : initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || "aismartinterview-1dc3f" });

export const firebaseAuth = getAuth(app);

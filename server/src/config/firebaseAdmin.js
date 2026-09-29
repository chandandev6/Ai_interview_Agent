// Firebase Admin sirf ID token verify karne ke liye — iske liye service account ki zarurat nahi, projectId kaafi hai
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "./env.js";

const app = getApps().length
    ? getApps()[0]
    : initializeApp({ projectId: env.FIREBASE_PROJECT_ID });

export const firebaseAuth = getAuth(app);

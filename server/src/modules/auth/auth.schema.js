// auth routes ke request ka shape — validate() middleware isse check karta hai
import { z } from "zod";

// field hi nahi bheja → "X is required", galat type bheja → "X must be a string"
const text = (field) =>
    z.string({ error: (issue) => (issue.input === undefined ? `${field} is required` : `${field} must be a string`) });

// pehle spaces hatao + lowercase, phir email format check
const email = text("Email").trim().toLowerCase().pipe(z.email("Enter a valid email address"));

export const googleSchema = z.object({
    idToken: text("idToken").min(1, "idToken is required"),
});

export const registerSchema = z.object({
    name: text("Name").trim().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
    email,
    // bcrypt sirf pehle 72 bytes dekhta hai — usse lamba password chup-chaap kat jaata, isliye max 72
    password: text("Password").min(8, "Password must be at least 8 characters").max(72, "Password must be at most 72 characters"),
});

export const loginSchema = z.object({
    email,
    // login par rules (min 8) mat lagao — sirf "khaali na ho"; galat ho to bcrypt bata dega
    password: text("Password").min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
    // hamara token hamesha 64 hex characters hota hai (randomBytes(32).toString("hex"))
    token: text("Token").regex(/^[a-f0-9]{64}$/, "Invalid verification link"),
});

export const resendVerificationSchema = z.object({
    email,
});

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { firebaseAuth } from "../../config/firebaseAdmin.js";
import { env } from "../../config/env.js";
import AppError from "../../utils/AppError.js";
import { sendMail } from "../../lib/mail/mailer.js";
import User from "../user/user.model.js";
import { findOrCreateGoogleUser, toSafeUser } from "../user/user.service.js";
import { verificationEmail } from "./auth.emails.js";

const BCRYPT_ROUNDS = 12; // 2^12 rounds ≈ 0.2s per hash — user ko pata nahi chalta, attacker ke liye bahut slow
const VERIFY_LINK_TTL = 24 * 60 * 60 * 1000; // 24 hours

// user na mile tab bhi ek bcrypt.compare chalao — warna "no user" wala jawab turant aata aur
// response time se attacker pata laga leta ki email registered hai ya nahi (timing attack)
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// link ke liye random token: plain wala email me jaata hai, uska hash DB me
const createVerificationToken = () => {
    const token = crypto.randomBytes(32).toString("hex");
    return { token, tokenHash: hashToken(token), expires: new Date(Date.now() + VERIFY_LINK_TTL) };
}

const sendVerificationLink = async (user) => {
    const { token, tokenHash, expires } = createVerificationToken();
    user.verificationToken = tokenHash;
    user.verificationTokenExpires = expires;
    await user.save();

    // CLIENT_URL me comma se kai URLs ho sakte hai — link pehle wale (main frontend) par
    const link = `${env.CLIENT_URL.split(",")[0]}/verify-email?token=${token}`;
    try {
        await sendMail({ to: user.email, ...verificationEmail({ name: user.name, link }) });
    }
    catch (error) {
        console.error("Failed to send verification email:", error.message);
        throw new AppError(502, "Could not send the verification email. Please try 'Resend' in a minute.");
    }
}

// client ka Firebase ID token verify karo — name/email pe bharosa mat karo, token se nikalo
export const loginWithGoogle = async (idToken) => {
    let decoded;
    try {
        decoded = await firebaseAuth.verifyIdToken(idToken);
    }
    catch (error) {
        throw new AppError(401, "Invalid Google token");
    }

    if(!decoded.email || !decoded.email_verified){
        throw new AppError(401, "Google account email not verified");
    }

    return findOrCreateGoogleUser({
        email: decoded.email.toLowerCase(),
        name: decoded.name || decoded.email.split("@")[0],
    });
}

export const registerUser = async ({ name, email, password }) => {
    const existing = await User.findOne({ email }).select("+password");

    if(existing && !existing.password){
        throw new AppError(409, "This email is registered with Google. Please use 'Continue with Google'.");
    }
    if(existing?.isVerified){
        throw new AppError(409, "An account with this email already exists. Please log in.");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // unverified account pehle se hai (shayad kisi aur ne banaya ya user ne dobara try kiya) —
    // naya password/naam rakh do; link sirf asli email owner tak jaayega, wahi verify kar payega
    const user = existing || new User({ email });
    user.name = name;
    user.password = passwordHash;

    try {
        await sendVerificationLink(user); // isme user.save() bhi hota hai
    }
    catch (error) {
        // do requests ek saath aayi aur dono ne naya user banaya — unique email index ne dusri rok di
        if (error.code === 11000) throw new AppError(409, "An account with this email already exists. Please log in.");
        throw error;
    }

    return { email: user.email };
}

export const verifyEmailToken = async (token) => {
    const user = await User.findOne({
        verificationToken: hashToken(token),
        verificationTokenExpires: { $gt: new Date() }, // expire na hua ho
    });
    if(!user){
        throw new AppError(400, "This verification link is invalid or has expired", "INVALID_VERIFICATION_LINK");
    }

    // link ek hi baar kaam kare — token hata do
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return toSafeUser(user);
}

export const loginWithPassword = async ({ email, password }) => {
    const user = await User.findOne({ email }).select("+password");

    // user na ho ya Google-only ho — tab bhi compare chalao (timing same rahe)
    const isMatch = await bcrypt.compare(password, user?.password || DUMMY_HASH);

    // "email galat" ya "password galat" alag mat batao — warna attacker registered emails dhoondh leta
    if(!user || !user.password || !isMatch){
        throw new AppError(401, "Invalid email or password");
    }

    // password sahi hone ke BAAD hi batao ki verify baaki hai — anjaan logon ko ye info nahi milni chahiye
    if(!user.isVerified){
        throw new AppError(403, "Please verify your email first. Check your inbox for the link.", "EMAIL_NOT_VERIFIED");
    }

    return toSafeUser(user);
}

export const resendVerification = async (email) => {
    const user = await User.findOne({ email }).select("+password");

    // sirf unverified password users ko bhejo; baaki cases me bhi same "OK" response (email exist karta hai ya nahi, pata na chale)
    if(user && !user.isVerified && user.password){
        await sendVerificationLink(user);
    }
}

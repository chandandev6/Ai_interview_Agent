import genToken from "../../config/token.js";
import { cookieOptions } from "../../config/cookie.js";
import { sendSuccess } from "../../utils/response.js";
import {
    loginWithGoogle,
    registerUser,
    verifyEmailToken,
    loginWithPassword,
    resendVerification,
    requestPasswordReset,
    resetPassword,
} from "./auth.service.js";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

//token do aur cookie me save kar do (token sirf httpOnly cookie me rahega) — Google aur password dono login yahi use karte hai
const setAuthCookie = (res, user) => {
    res.cookie("token", genToken(user._id), { ...cookieOptions, maxAge: SEVEN_DAYS });
};

export const googleAuth = async (req, res) => {
    const user = await loginWithGoogle(req.body.idToken);
    setAuthCookie(res, user);
    return sendSuccess(res, { message: "Google authentication successful", data: { user } });
};

// signup par login NAHI — pehle email verify karna hoga
export const register = async (req, res) => {
    const data = await registerUser(req.body);
    return sendSuccess(res, {
        status: 201,
        message: "Account created. Check your email for the verification link.",
        data,
    });
};

// link click → verify → seedha login (cookie)
export const verifyEmail = async (req, res) => {
    const user = await verifyEmailToken(req.body.token);
    setAuthCookie(res, user);
    return sendSuccess(res, { message: "Email verified successfully", data: { user } });
};

export const login = async (req, res) => {
    const user = await loginWithPassword(req.body);
    setAuthCookie(res, user);
    return sendSuccess(res, { message: "Login successful", data: { user } });
};

export const resendVerificationEmail = async (req, res) => {
    await resendVerification(req.body.email);
    return sendSuccess(res, { message: "If this account needs verification, a new link has been sent." });
};

// email registered ho ya na ho — response hamesha same
export const forgotPassword = async (req, res) => {
    await requestPasswordReset(req.body.email);
    return sendSuccess(res, { message: "If an account exists for this email, a reset link has been sent." });
};

// naya password set → seedha login
export const resetPasswordWithToken = async (req, res) => {
    const user = await resetPassword(req.body);
    setAuthCookie(res, user);
    return sendSuccess(res, { message: "Password updated. You're now logged in.", data: { user } });
};

export const logout = async (req, res) => {
    res.clearCookie("token", cookieOptions);
    return sendSuccess(res, { message: "Logout successful" });
};

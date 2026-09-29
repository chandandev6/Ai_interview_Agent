// auth ke saare server calls — components sirf ye functions call karte hai, URL/axios nahi jaante
// har function server ka body return karta hai: { success, message, data }
import api from "./axios.js";

const body = (response) => response.data;

export const googleLogin = (idToken) => api.post("/api/auth/google", { idToken }).then(body);

export const registerUser = ({ name, email, password }) =>
    api.post("/api/auth/register", { name, email, password }).then(body);

export const loginUser = ({ email, password }) => api.post("/api/auth/login", { email, password }).then(body);

export const verifyEmail = (token) => api.post("/api/auth/verify-email", { token }).then(body);

export const resendVerification = (email) => api.post("/api/auth/resend-verification", { email }).then(body);

export const forgotPassword = (email) => api.post("/api/auth/forgot-password", { email }).then(body);

export const resetPassword = ({ token, password }) =>
    api.post("/api/auth/reset-password", { token, password }).then(body);

export const logoutUser = () => api.post("/api/auth/logout").then(body);

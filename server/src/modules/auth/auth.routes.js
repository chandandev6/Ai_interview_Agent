import express from "express";
import { googleAuth, register, verifyEmail, login, resendVerificationEmail, logout } from "./auth.controller.js";
import validate from "../../middlewares/validate.js";
import { authLimiter } from "../../middlewares/rateLimit.js";
import { googleSchema, registerSchema, loginSchema, verifyEmailSchema, resendVerificationSchema } from "./auth.schema.js";

const authRouter = express.Router();

// har route: (limiter) → body check → controller
authRouter.post("/google", validate({ body: googleSchema }), googleAuth);
authRouter.post("/register", authLimiter, validate({ body: registerSchema }), register);
authRouter.post("/login", authLimiter, validate({ body: loginSchema }), login);
authRouter.post("/verify-email", validate({ body: verifyEmailSchema }), verifyEmail);
authRouter.post("/resend-verification", authLimiter, validate({ body: resendVerificationSchema }), resendVerificationEmail);
authRouter.post("/logout", logout);

export default authRouter;

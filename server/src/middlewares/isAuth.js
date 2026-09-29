//token se id nikal ke user ko authenticate karne ka middleware
import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import { env } from "../config/env.js";

const isAuth = (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        throw new AppError(401, "Unauthorized: no token");
    }

    try {
        const verifyToken = jwt.verify(token, env.JWT_SECRET);
        req.userId = verifyToken.userId;
    } catch {
        // expired/galat token = 401, 500 nahi
        throw new AppError(401, "Invalid or expired token");
    }

    next();
};

export default isAuth;

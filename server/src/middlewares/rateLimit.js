// ek IP / user ek minute me kitni requests bhej sakta hai — bots se server aur AI bill dono bachao
// NOTE: counter abhi server ki memory me hai (restart par reset, har server ka alag) — Step 22 me Redis store lagayenge
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

const ONE_MINUTE = 60 * 1000;

// har route par — key = IP (login se pehle bhi kaam karta hai)
export const globalLimiter = rateLimit({
    windowMs: ONE_MINUTE,
    limit: 100,
    standardHeaders: "draft-8", // client ko RateLimit header bhejo (kitni bachi, kab reset)
    legacyHeaders: false,       // purane X-RateLimit-* headers nahi chahiye
    message: { success: false, message: "Too many requests, please try again in a minute" },
});

// sirf AI wale routes par, isAuth ke BAAD lagana — tab req.userId milta hai
// key = userId, taaki ek hostel/college ki shared IP par sab block na ho
export const aiLimiter = rateLimit({
    windowMs: ONE_MINUTE,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // userId na ho (galti se isAuth se pehle laga diya) to IP se count karo
    keyGenerator: (req) => req.userId ?? ipKeyGenerator(req.ip),
    message: { success: false, message: "Too many AI requests, please wait a minute" },
});

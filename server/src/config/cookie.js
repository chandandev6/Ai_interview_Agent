// cookie options ek jagah — production me secure cookie + cross-site allowed
import { env } from "./env.js";

const isProd = env.NODE_ENV === "production";

export const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "strict",
};

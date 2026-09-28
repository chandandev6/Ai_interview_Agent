import genToken from "../../config/token.js";
import { cookieOptions } from "../../config/cookie.js";
import { sendSuccess } from "../../utils/response.js";
import { loginWithGoogle } from "./auth.service.js";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export const googleAuth = async (req , res) =>{
    const user = await loginWithGoogle(req.body?.idToken);

    //token do aur cookie me save kar do (token sirf httpOnly cookie me rahega)
    res.cookie("token", genToken(user._id), { ...cookieOptions, maxAge: SEVEN_DAYS });

    return sendSuccess(res, { message: "Google authentication successful", data: { user } });
}

export const logout = async (req, res) => {
    res.clearCookie("token", cookieOptions);
    return sendSuccess(res, { message: "Logout successful" });
}

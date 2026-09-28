import { firebaseAuth } from "../../config/firebaseAdmin.js";
import AppError from "../../utils/AppError.js";
import { findOrCreateByEmail } from "../user/user.service.js";

// client ka Firebase ID token verify karo — name/email pe bharosa mat karo, token se nikalo
export const loginWithGoogle = async (idToken) => {
    if(!idToken){
        throw new AppError(400, "idToken is required");
    }

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

    return findOrCreateByEmail({
        email: decoded.email,
        name: decoded.name || decoded.email.split("@")[0],
    });
}

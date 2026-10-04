import User from "./user.model.js";
import AppError from "../../utils/AppError.js";
import { recordSignupBonus } from "../credit/credit.service.js";
import { cached, cacheKeys, clearCache } from "../../lib/cache.js";

// response me bhejne se pehle secret fields hatao (login me .select("+password") kiya ho tab bhi)
export const toSafeUser = (user) => {
    const {
        password,
        verificationToken,
        verificationTokenExpires,
        passwordResetToken,
        passwordResetExpires,
        __v,
        ...safeUser
    } = user.toObject ? user.toObject() : user;
    return safeUser;
};

export const getUserById = async (userId) => {
    const user = await User.findById(userId).lean();
    if (!user) {
        throw new AppError(404, "User not found");
    }
    return toSafeUser(user);
};

// har page load par aata hai — 60s Redis me rakho. Credits/verify badle to clearUserCache se turant hatate hai
const USER_CACHE_TTL = 60;
export const getCurrentUserCached = (userId) =>
    cached(cacheKeys.user(userId), USER_CACHE_TTL, () => getUserById(userId));

// user ka koi bhi field badle (credit, isVerified...) → ye bulao. DB write ke BAAD (transaction commit ke baad)
export const clearUserCache = (userId) => clearCache(cacheKeys.user(userId));

// Google login ke baad user lao, nahi hai to bna do — Google ne email verify kiya hai, isliye isVerified: true
export const findOrCreateGoogleUser = async ({ email, name }) => {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        const created = await User.create({ name, email, isVerified: true });
        await recordSignupBonus(created); // passbook ki pehli row: welcome credits
        return toSafeUser(created);
    }

    if (!user.isVerified) {
        // kisi ne is email se password account banaya par verify nahi kiya — ho sakta hai attacker ho.
        // asli owner Google se aaya hai, to wo unverified password hata do (warna attacker usse login kar leta)
        // purane Google users (isVerified field hi nahi tha) bhi yahi se verified ho jaate hai
        user.isVerified = true;
        user.password = undefined;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();
        await clearUserCache(user._id);
    }
    return toSafeUser(user);
};

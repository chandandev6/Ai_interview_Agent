import User from "./user.model.js";
import AppError from "../../utils/AppError.js";
import { recordSignupBonus } from "../credit/credit.service.js";

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
    }
    return toSafeUser(user);
};

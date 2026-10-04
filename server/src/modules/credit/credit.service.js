// credits badalne ka EK hi rasta — balance update + ledger row hamesha saath, ek MongoDB transaction me.
// Transaction = dono likhe jaayenge ya dono me se koi nahi (beech me crash ho to aadha kaam nahi bachta)
import mongoose from "mongoose";
import User from "../user/user.model.js";
import Transaction from "./transaction.model.js";
import { getLogger } from "../../lib/logger.js";

// credit kaato — sirf tab jab kaafi ho ($gte check + $inc ek hi atomic query). Kam ho to null (kuch nahi badla)
export const chargeCredits = async (userId, amount, { interviewId } = {}) =>
    mongoose.connection.transaction(async (session) => {
        const user = await User.findOneAndUpdate(
            { _id: userId, credit: { $gte: amount } },
            { $inc: { credit: -amount } },
            { returnDocument: "after", session },
        );
        if (!user) return null;
        await Transaction.create(
            [{ userId, type: "interview", amount: -amount, balanceAfter: user.credit, interviewId }],
            { session },
        );
        return user;
    });

// credit jodo (refund / purchase). paymentId diya hai aur pehle hi use ho chuka → unique index E11000 → poora rollback
export const addCredits = async (userId, amount, { type, interviewId, paymentId, note }) =>
    mongoose.connection.transaction(async (session) => {
        const user = await User.findOneAndUpdate(
            { _id: userId },
            { $inc: { credit: amount } },
            { returnDocument: "after", session },
        );
        if (!user) throw new Error(`User ${userId} not found while adding credits`);
        await Transaction.create([{ userId, type, amount, balanceAfter: user.credit, interviewId, paymentId, note }], {
            session,
        });
        return user;
    });

// naye user ko default credits milte hai (User model default) — passbook ki pehli row.
// Fail ho to signup mat roko (bas log) — balance sahi hai, sirf history ki ek line kam hogi
export const recordSignupBonus = async (user) => {
    try {
        await Transaction.create({
            userId: user._id,
            type: "signup_bonus",
            amount: user.credit,
            balanceAfter: user.credit,
            note: "Welcome credits",
        });
    } catch (error) {
        if (error.code !== 11000) getLogger().error({ err: error }, "Signup bonus ledger failed");
    }
};

// account page — newest first, page by page (history jaisa hi)
export const getTransactions = async (userId, { page, limit }) => {
    const [items, total] = await Promise.all([
        Transaction.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select("type amount balanceAfter interviewId note createdAt")
            .lean(),
        Transaction.countDocuments({ userId }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

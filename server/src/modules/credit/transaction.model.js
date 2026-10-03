import mongoose from "mongoose";

export const TRANSACTION_TYPES = ["signup_bonus", "interview", "refund", "purchase"];

// credits ka ledger (bank passbook jaisa): har + / - ki ek row. User.credit = abhi ka balance,
// ye rows batati hai "kyun" — support ("mere credit kaha gaye?") aur hisaab dono ke liye
const transactionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: TRANSACTION_TYPES, required: true },
        amount: { type: Number, required: true }, // + aaya, - gaya
        balanceAfter: { type: Number, required: true }, // is row ke baad balance — passbook ki tarah
        interviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Interview" }, // interview / refund
        paymentId: { type: String }, // purchase — Razorpay payment id
        note: { type: String },
    },
    { timestamps: true },
);

// account page: "meri transactions, newest first"
transactionSchema.index({ userId: 1, createdAt: -1 });

// ek payment = ek hi "purchase" row — verify + webhook dono aaye ya webhook do baar aaye, DB doosri row mana kar dega
transactionSchema.index(
    { paymentId: 1 },
    { unique: true, partialFilterExpression: { paymentId: { $type: "string" } } },
);

// signup bonus ek user ko ek hi baar
transactionSchema.index(
    { userId: 1 },
    { unique: true, partialFilterExpression: { type: "signup_bonus" }, name: "one_signup_bonus_per_user" },
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;

import mongoose from "mongoose";

// har "Buy" click = ek Razorpay order = ek row. status "paid" hona hi credit milne ka ek-matra darwaza hai
const paymentSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        planId: { type: String, required: true },
        credits: { type: Number, required: true }, // order ke time ka — baad me plan badle to bhi user ko wahi mile jo dikha tha
        amount: { type: Number, required: true }, // paise
        currency: { type: String, default: "INR" },
        razorpayOrderId: { type: String, required: true, unique: true },
        razorpayPaymentId: { type: String },
        status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
        paidAt: { type: Date },
        failureReason: { type: String },
    },
    { timestamps: true },
);

paymentSchema.index({ userId: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;

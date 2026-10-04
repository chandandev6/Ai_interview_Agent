import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import {
    isValidPaymentSignature,
    isValidWebhookSignature,
    paymentsEnabled,
    razorpay,
} from "../../lib/payment/razorpay.js";
import User from "../user/user.model.js";
import Transaction from "../credit/transaction.model.js";
import Payment from "./payment.model.js";
import { getLogger } from "../../lib/logger.js";
import { clearUserCache } from "../user/user.service.js";
import { getPlan, PLANS } from "./payment.plans.js";

const ensureEnabled = () => {
    if (!paymentsEnabled) {
        throw new AppError(503, "Payments are not available right now. Please try again later.", "PAYMENTS_DISABLED");
    }
};

export const listPlans = () => ({ plans: PLANS, enabled: paymentsEnabled });

// 1. "Buy" → Razorpay par order banao (amount SERVER tay karta hai — client price nahi bhejta, warna ₹1 me 4000 credits)
export const createOrder = async (userId, planId) => {
    ensureEnabled();
    const plan = getPlan(planId);
    const amount = plan.priceInr * 100;

    let order;
    try {
        order = await razorpay.orders.create({
            amount,
            currency: "INR",
            receipt: `rcpt_${Date.now()}`, // max 40 chars
            notes: { userId: String(userId), planId }, // Razorpay dashboard me dikhta hai — support ke kaam aata hai
        });
    } catch (error) {
        getLogger().error({ providerError: error?.error?.description || error.message }, "Razorpay order failed");
        throw new AppError(502, "Could not start the payment. Please try again.", "PAYMENT_PROVIDER_ERROR");
    }

    await Payment.create({
        userId,
        planId,
        credits: plan.credits,
        amount,
        currency: "INR",
        razorpayOrderId: order.id,
    });

    // checkout popup kholne ke liye client ko itna chahiye (key_id public hai, secret kabhi nahi)
    return { orderId: order.id, amount, currency: "INR", keyId: env.RAZORPAY_KEY_ID, plan };
};

// credit dene ka EK hi function — verify (browser) aur webhook (Razorpay) dono yahi bulate hai.
// Order "paid" mark karna + credit + ledger row = ek MongoDB transaction. Order pehle se paid → kuch nahi (idempotent)
const fulfillOrder = async (orderId, paymentId) => {
    const result = await mongoose.connection.transaction(async (session) => {
        // claim: sirf ek request isse "paid" kar payegi. Do saath aaye to MongoDB ek ko write-conflict deta hai,
        // mongoose usse dobara chalata hai — tab tak "paid" ho chuka → null → koi credit nahi
        const payment = await Payment.findOneAndUpdate(
            { razorpayOrderId: orderId, status: { $ne: "paid" } },
            // pehli try fail hui thi to uska reason ab galat hai — hata do
            {
                $set: { status: "paid", razorpayPaymentId: paymentId, paidAt: new Date() },
                $unset: { failureReason: "" },
            },
            { returnDocument: "after", session },
        );
        if (!payment) return { alreadyProcessed: true };

        const user = await User.findOneAndUpdate(
            { _id: payment.userId },
            { $inc: { credit: payment.credits } },
            { returnDocument: "after", session },
        );
        // paymentId unique index — kisi bhi raste se doosri "purchase" row aayi to poora transaction rollback
        await Transaction.create(
            [
                {
                    userId: payment.userId,
                    type: "purchase",
                    amount: payment.credits,
                    balanceAfter: user.credit,
                    paymentId,
                    note: `${getPlan(payment.planId)?.name ?? payment.planId} pack`,
                },
            ],
            { session },
        );
        return { alreadyProcessed: false, creditsAdded: payment.credits, credit: user.credit, userId: payment.userId };
    });
    // commit ke baad — naya balance agli current-user call par DB se aaye
    if (!result.alreadyProcessed) await clearUserCache(result.userId);
    return result;
};

// 2. checkout success → browser se. Signature sahi + order isi user ka → credit
export const verifyPayment = async (userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    ensureEnabled();
    const valid = isValidPaymentSignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
    });
    if (!valid) throw new AppError(400, "Payment could not be verified.", "INVALID_PAYMENT_SIGNATURE");

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, userId });
    if (!payment) throw new AppError(404, "Order not found.", "ORDER_NOT_FOUND");

    const result = await fulfillOrder(razorpay_order_id, razorpay_payment_id);
    // webhook pehle aa chuka tha — credit mil chuka, bas latest balance bhejo
    const credit = result.credit ?? (await User.findById(userId).select("credit").lean())?.credit;
    return { credit, creditsAdded: payment.credits, alreadyProcessed: result.alreadyProcessed };
};

// 3. webhook — Razorpay ka server seedha hamare server ko batata hai. User ne payment ke baad tab band kar diya
// (verify kabhi nahi aaya) tab bhi credit milta hai. Razorpay retry karta hai, isliye idempotent hona zaroori
export const handleWebhook = async (rawBody, signature) => {
    if (!isValidWebhookSignature(rawBody, signature)) {
        throw new AppError(400, "Invalid webhook signature.", "INVALID_WEBHOOK_SIGNATURE");
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    const entity = event.payload?.payment?.entity;
    if (!entity?.order_id) return { ignored: true }; // humare kaam ka event nahi

    const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
    if (!payment) return { ignored: true }; // kisi aur app/test ka order

    if (event.event === "payment.captured" || event.event === "order.paid") {
        // jitna maanga tha utna hi aaya? (galti / chhed-chhaad se kam amount par credit na ho)
        if (entity.amount !== payment.amount) {
            getLogger().error(
                { orderId: entity.order_id, got: entity.amount, expected: payment.amount },
                "Webhook amount mismatch",
            );
            return { ignored: true };
        }
        const result = await fulfillOrder(entity.order_id, entity.id);
        return { processed: !result.alreadyProcessed };
    }

    if (event.event === "payment.failed") {
        // sirf "created" ko failed karo — paid order ko kabhi nahi (user ne doosri try me pay kar diya ho)
        await Payment.updateOne(
            { razorpayOrderId: entity.order_id, status: "created" },
            { $set: { status: "failed", failureReason: entity.error_description || entity.error_code } },
        );
    }
    return { processed: true };
};

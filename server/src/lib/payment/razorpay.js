// Razorpay client + signature checks — gateway ki saari "crypto" ek jagah
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "../../config/env.js";

// keys na ho (khaali bhi) → payments band. App phir bhi chalta hai, sirf "Buy" par saaf error
export const paymentsEnabled = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

export const razorpay = paymentsEnabled
    ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
    : null;

const hmacSha256 = (data, secret) => crypto.createHmac("sha256", secret).update(data).digest("hex");

// timingSafeEqual — normal "===" pehle galat character par ruk jaata hai; us time ke farak se
// attacker signature ek-ek character guess kar sakta hai. Ye hamesha poora compare karta hai
const safeEqual = (a, b) => {
    const left = Buffer.from(String(a));
    const right = Buffer.from(String(b));
    return left.length === right.length && crypto.timingSafeEqual(left, right);
};

// checkout ke baad browser ye 3 cheezein bhejta hai. Signature = HMAC(order_id + "|" + payment_id, KEY_SECRET).
// Secret sirf Razorpay aur hamare server ke paas hai — client fake "payment ho gaya" nahi bana sakta
export const isValidPaymentSignature = ({ orderId, paymentId, signature }) =>
    paymentsEnabled && safeEqual(hmacSha256(`${orderId}|${paymentId}`, env.RAZORPAY_KEY_SECRET), signature);

// webhook: Razorpay poori raw body ka HMAC (webhook secret se) header me bhejta hai.
// RAW bytes chahiye — JSON parse karke dobara stringify kiya to spaces/order badal ke signature mismatch
export const isValidWebhookSignature = (rawBody, signature) =>
    Boolean(env.RAZORPAY_WEBHOOK_SECRET) &&
    Boolean(signature) &&
    safeEqual(hmacSha256(rawBody, env.RAZORPAY_WEBHOOK_SECRET), signature);

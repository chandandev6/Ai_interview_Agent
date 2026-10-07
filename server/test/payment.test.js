import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import Transaction from "../src/modules/credit/transaction.model.js";
import Payment from "../src/modules/payment/payment.model.js";
import User from "../src/modules/user/user.model.js";
import { api, createUser } from "./helpers/index.js";

// Razorpay jaisa signature khud banao — vitest.config.js ke fake secrets se
const hmac = (data, secret) => crypto.createHmac("sha256", secret).update(data).digest("hex");
const checkoutSignature = (orderId, paymentId) => hmac(`${orderId}|${paymentId}`, "test_key_secret");

// /order asli Razorpay API bulata hai — tests me order seedha DB me (jaise /order ne banaya ho)
const createOrder = (userId, orderId = `order_${crypto.randomUUID().slice(0, 8)}`) =>
    Payment.create({ userId, planId: "pro", credits: 1500, amount: 24900, razorpayOrderId: orderId });

const verify = (cookie, orderId, paymentId, signature = checkoutSignature(orderId, paymentId)) =>
    api().post("/api/payment/verify").set("Cookie", cookie).send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
    });

const webhook = (
    orderId,
    paymentId,
    { amount = 24900, event = "payment.captured", secret = "test_webhook_secret" } = {},
) => {
    const body = JSON.stringify({
        event,
        payload: { payment: { entity: { id: paymentId, order_id: orderId, amount } } },
    });
    return api()
        .post("/api/payment/webhook")
        .set("Content-Type", "application/json")
        .set("X-Razorpay-Signature", hmac(body, secret))
        .send(body);
};

const creditOf = async (userId) => (await User.findById(userId)).credit;

describe("payments", () => {
    it("valid checkout signature → +1500 credits once; repeating verify adds nothing", async () => {
        const { user, cookie } = await createUser({ credit: 500 });
        const { razorpayOrderId } = await createOrder(user._id);

        const first = await verify(cookie, razorpayOrderId, "pay_1");
        expect(first.status).toBe(200);
        expect(first.body.data).toMatchObject({ credit: 2000, creditsAdded: 1500, alreadyProcessed: false });

        const second = await verify(cookie, razorpayOrderId, "pay_1");
        expect(second.body.data.alreadyProcessed).toBe(true);
        expect(await creditOf(user._id)).toBe(2000);
        expect(await Transaction.countDocuments({ userId: user._id, type: "purchase" })).toBe(1);
    });

    it("fake signature (client says 'I paid') → 400, no credits", async () => {
        const { user, cookie } = await createUser({ credit: 500 });
        const { razorpayOrderId } = await createOrder(user._id);
        const res = await verify(cookie, razorpayOrderId, "pay_1", "0".repeat(64));
        expect(res.status).toBe(400);
        expect(res.body.code).toBe("INVALID_PAYMENT_SIGNATURE");
        expect(await creditOf(user._id)).toBe(500);
    });

    it("cannot claim someone else's order → 404", async () => {
        const a = await createUser();
        const b = await createUser({ credit: 500 });
        const { razorpayOrderId } = await createOrder(a.user._id);
        const res = await verify(b.cookie, razorpayOrderId, "pay_1");
        expect(res.status).toBe(404);
        expect(await creditOf(b.user._id)).toBe(500);
    });

    it("webhook: wrong signature → 400; valid → credited; Razorpay retries → not credited again", async () => {
        const { user } = await createUser({ credit: 500 });
        const { razorpayOrderId } = await createOrder(user._id);

        expect((await webhook(razorpayOrderId, "pay_9", { secret: "attacker-secret" })).status).toBe(400);
        expect(await creditOf(user._id)).toBe(500);

        expect((await webhook(razorpayOrderId, "pay_9")).status).toBe(200);
        expect((await webhook(razorpayOrderId, "pay_9")).status).toBe(200);
        expect(await creditOf(user._id)).toBe(2000);
    });

    it("webhook with a smaller amount than the order → ignored", async () => {
        const { user } = await createUser({ credit: 500 });
        const { razorpayOrderId } = await createOrder(user._id);
        await webhook(razorpayOrderId, "pay_cheap", { amount: 100 });
        expect(await creditOf(user._id)).toBe(500);
        expect((await Payment.findOne({ razorpayOrderId })).status).toBe("created");
    });

    it("RACE: browser verify + webhooks arriving together → credited exactly once", async () => {
        const { user, cookie } = await createUser({ credit: 500 });
        const { razorpayOrderId } = await createOrder(user._id);

        await Promise.all([
            verify(cookie, razorpayOrderId, "pay_r"),
            verify(cookie, razorpayOrderId, "pay_r"),
            verify(cookie, razorpayOrderId, "pay_r"),
            webhook(razorpayOrderId, "pay_r"),
            webhook(razorpayOrderId, "pay_r"),
            webhook(razorpayOrderId, "pay_r"),
        ]);

        expect(await creditOf(user._id)).toBe(2000);
        expect(await Transaction.countDocuments({ userId: user._id, type: "purchase" })).toBe(1);
        expect((await Payment.findOne({ razorpayOrderId })).status).toBe("paid");
    });
});

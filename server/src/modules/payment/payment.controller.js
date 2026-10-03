import { sendSuccess } from "../../utils/response.js";
import { createOrder, handleWebhook, listPlans, verifyPayment } from "./payment.service.js";

export const getPlans = async (req, res) => sendSuccess(res, { data: listPlans() });

export const createPaymentOrder = async (req, res) => {
    const order = await createOrder(req.userId, req.body.planId);
    return sendSuccess(res, { status: 201, message: "Order created", data: order });
};

export const verifyPaymentResult = async (req, res) => {
    const result = await verifyPayment(req.userId, req.body);
    return sendSuccess(res, { message: "Payment successful", data: result });
};

// req.body yaha Buffer hai (express.raw) — signature raw bytes par check hota hai
export const razorpayWebhook = async (req, res) => {
    const result = await handleWebhook(req.body, req.get("x-razorpay-signature"));
    return sendSuccess(res, { message: "Webhook received", data: result });
};

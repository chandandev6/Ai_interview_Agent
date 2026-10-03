import express from "express";
import isAuth from "../../middlewares/isAuth.js";
import validate from "../../middlewares/validate.js";
import { createOrderSchema, verifyPaymentSchema } from "./payment.schema.js";
import { createPaymentOrder, getPlans, razorpayWebhook, verifyPaymentResult } from "./payment.controller.js";

const paymentRouter = express.Router();

paymentRouter.get("/plans", getPlans); // public — pricing page bina login bhi dikh sake
paymentRouter.post("/order", isAuth, validate({ body: createOrderSchema }), createPaymentOrder);
paymentRouter.post("/verify", isAuth, validate({ body: verifyPaymentSchema }), verifyPaymentResult);

// webhook: login nahi (Razorpay ka server bhejta hai), signature hi pehchaan hai.
// app.js ise express.json() se PEHLE lagata hai — raw body chahiye
export const webhookRouter = express.Router();
webhookRouter.post("/", express.raw({ type: "application/json", limit: "1mb" }), razorpayWebhook);

export default paymentRouter;

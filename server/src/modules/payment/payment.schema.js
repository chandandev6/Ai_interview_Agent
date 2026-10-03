import { z } from "zod";
import { PLAN_IDS } from "./payment.plans.js";

export const createOrderSchema = z.object({
    planId: z.enum(PLAN_IDS, { error: `planId must be one of: ${PLAN_IDS.join(", ")}` }),
});

// Razorpay checkout ke handler me ye 3 fields aate hai — naam waise hi rakhe (frontend seedha forward kare)
export const verifyPaymentSchema = z.object({
    razorpay_order_id: z.string().min(1).max(100),
    razorpay_payment_id: z.string().min(1).max(100),
    razorpay_signature: z.string().min(1).max(200),
});

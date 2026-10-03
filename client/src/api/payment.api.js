// credits kharidna — returns { success, message, data }
import api from "./axios.js";

const body = (response) => response.data;

export const getPlans = () => api.get("/api/payment/plans").then(body);

// amount server tay karta hai — client sirf plan ka id bhejta hai
export const createOrder = (planId) => api.post("/api/payment/order", { planId }).then(body);

// Razorpay checkout ka jawab (order_id, payment_id, signature) seedha server ko — wahi check karke credit deta hai
export const verifyPayment = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) =>
    api.post("/api/payment/verify", { razorpay_order_id, razorpay_payment_id, razorpay_signature }).then(body);

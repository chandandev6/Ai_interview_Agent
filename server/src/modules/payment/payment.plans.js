// credit packs — price badalna ho to sirf yaha. amount paise me (Razorpay paise maangta hai: ₹99 = 9900)
// interview 50 credits ka hai → Starter = 10 interviews
export const PLANS = [
    { id: "starter", name: "Starter", credits: 500, priceInr: 99 },
    { id: "pro", name: "Pro", credits: 1500, priceInr: 249, popular: true },
    { id: "max", name: "Max", credits: 4000, priceInr: 599 },
];

export const PLAN_IDS = PLANS.map((plan) => plan.id);

export const getPlan = (planId) => PLANS.find((plan) => plan.id === planId);

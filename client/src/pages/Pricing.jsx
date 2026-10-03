import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { BsCheck2, BsCoin, BsShieldCheck } from "react-icons/bs";
import Navbar from "../components/Navbar";
import { createOrder, getPlans, verifyPayment } from "../api/payment.api.js";
import { setCredit } from "../redux/userSlice.js";
import { loadRazorpay } from "../utils/loadRazorpay.js";
import getErrorMessage from "../utils/getErrorMessage.js";
import { INTERVIEW_COST } from "../constants/interview.js";

// /pricing — credit packs. Flow: Buy → server order → Razorpay popup → server verify → credits
function Pricing() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state) => state.user.userData);

    const [plans, setPlans] = useState(null);
    const [enabled, setEnabled] = useState(true);
    const [error, setError] = useState("");
    const [buying, setBuying] = useState(null); // jis plan ka popup khula hai

    useEffect(() => {
        getPlans()
            .then((res) => {
                setPlans(res.data.plans);
                setEnabled(res.data.enabled);
            })
            .catch((err) => setError(getErrorMessage(err)));
    }, []);

    const buy = async (plan) => {
        setBuying(plan.id);
        try {
            const [{ data: order }, Razorpay] = await Promise.all([createOrder(plan.id), loadRazorpay()]);

            const checkout = new Razorpay({
                key: order.keyId,
                order_id: order.orderId,
                amount: order.amount,
                currency: order.currency,
                name: "InterviewIQ.AI",
                description: `${plan.name} pack · ${plan.credits} credits`,
                prefill: { name: user?.name, email: user?.email },
                theme: { color: "#111111" },
                // payment ho gaya → server se pakka karwao (client ka "success" bharosa layak nahi)
                handler: async (response) => {
                    try {
                        const res = await verifyPayment(response);
                        dispatch(setCredit(res.data.credit));
                        toast.success(`${res.data.creditsAdded} credits added!`);
                        navigate("/account");
                    } catch (err) {
                        // paisa kat gaya par verify nahi hua (network) — webhook thodi der me credit de dega
                        console.error("Verify failed:", err);
                        toast.error(
                            "Payment received. Your credits will appear in a minute — refresh your account page.",
                            {
                                duration: 8000,
                            },
                        );
                    } finally {
                        setBuying(null);
                    }
                },
                modal: { ondismiss: () => setBuying(null) }, // user ne popup band kiya
            });
            checkout.on("payment.failed", (response) => {
                toast.error(response.error?.description || "Payment failed. You were not charged.");
            });
            checkout.open();
        } catch (err) {
            toast.error(err.response ? getErrorMessage(err) : err.message);
            setBuying(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f3f3]">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-semibold">Buy credits</h1>
                    <p className="text-gray-500 mt-2">
                        One interview costs {INTERVIEW_COST} credits. Credits never expire.
                    </p>
                    {user && (
                        <p className="inline-flex items-center gap-1.5 mt-4 bg-green-100 px-4 py-1.5 rounded-full text-sm">
                            Your balance: <strong>{user.credit}</strong> <BsCoin />
                        </p>
                    )}
                </div>

                {!enabled && (
                    <p className="max-w-xl mx-auto mb-8 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                        Payments are not available right now. Please check back later.
                    </p>
                )}
                {error && <p className="text-center text-red-600 mb-6">{error}</p>}

                <div className="grid md:grid-cols-3 gap-5">
                    {(plans ?? [null, null, null]).map((plan, index) =>
                        plan ? (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08 }}
                                className={`relative bg-white rounded-3xl p-6 flex flex-col border-2 ${
                                    plan.popular ? "border-green-500 shadow-xl" : "border-gray-200"
                                }`}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                                        Most popular
                                    </span>
                                )}
                                <h2 className="font-semibold text-lg">{plan.name}</h2>
                                <p className="mt-3">
                                    <span className="text-4xl font-bold">₹{plan.priceInr}</span>
                                    <span className="text-gray-500 text-sm"> one-time</span>
                                </p>
                                <ul className="mt-5 space-y-2 text-sm text-gray-700 flex-1">
                                    <li className="flex items-center gap-2">
                                        <BsCheck2 className="text-green-600" /> {plan.credits.toLocaleString()} credits
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BsCheck2 className="text-green-600" />{" "}
                                        {Math.floor(plan.credits / INTERVIEW_COST)} interviews
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BsCheck2 className="text-green-600" /> ₹
                                        {((plan.priceInr / plan.credits) * INTERVIEW_COST).toFixed(1)} per interview
                                    </li>
                                </ul>
                                <button
                                    type="button"
                                    onClick={() => buy(plan)}
                                    disabled={!enabled || buying !== null}
                                    className={`mt-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                        plan.popular
                                            ? "bg-black text-white hover:bg-gray-800"
                                            : "border border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    {buying === plan.id ? "Opening payment…" : `Buy ${plan.name}`}
                                </button>
                            </motion.div>
                        ) : (
                            <div
                                key={index}
                                className="h-80 bg-white rounded-3xl border border-gray-200 animate-pulse"
                            />
                        ),
                    )}
                </div>

                <p className="text-xs text-gray-500 text-center mt-8 flex items-center justify-center gap-1.5">
                    <BsShieldCheck /> Secure payments by Razorpay — UPI, cards, netbanking and wallets.
                </p>
            </div>
        </div>
    );
}

export default Pricing;

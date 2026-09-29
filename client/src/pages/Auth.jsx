import { useState } from "react";
import { FaRobot } from "react-icons/fa6";
import { FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import { RiSparkling2Fill } from "react-icons/ri";
import { FcGoogle } from "react-icons/fc";
import { MdMarkEmailRead } from "react-icons/md";
import { motion } from "motion/react";
import { auth, provider } from "../utils/firebase";
import { signInWithPopup } from "firebase/auth";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { setUserData } from "../redux/userSlice.js";
import { googleLogin, registerUser, loginUser, resendVerification, forgotPassword } from "../api/auth.api.js";
import getErrorMessage from "../utils/getErrorMessage.js";

const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black";

function Auth({ isModel = false, onClose }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    // "login" | "register" | "check-email" (signup ke baad "inbox check karo") | "forgot" (reset link maango)
    const [mode, setMode] = useState("login");
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [needsVerification, setNeedsVerification] = useState(false); // login par "verify pehle karo" aaya to resend button dikhao

    const isRegister = mode === "register";

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setError("");
        setInfo("");
        setNeedsVerification(false);
    };

    const onLoggedIn = (user) => {
        dispatch(setUserData(user)); // Navbar update + modal khud band (Authmodel)
        // ProtectedRoute ne yaha bheja tha to wapas usi page par, warna home
        if (!isModel) navigate(location.state?.from || "/", { replace: true });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // form submit par page reload mat karo
        setError("");
        setInfo("");
        setNeedsVerification(false);
        setLoading(true);
        try {
            if (isRegister) {
                await registerUser(form);
                setMode("check-email"); // signup par login nahi — pehle email verify
            } else {
                const res = await loginUser(form);
                onLoggedIn(res.data.user);
            }
        } catch (error) {
            setError(getErrorMessage(error));
            // message ki jagah code check karo — message kabhi badle to bhi ye chalega
            if (error.response?.data?.code === "EMAIL_NOT_VERIFIED") setNeedsVerification(true);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setInfo("");
        setLoading(true);
        try {
            const res = await resendVerification(form.email);
            setInfo(res.message);
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError("");
        setInfo("");
        setLoading(true);
        try {
            const res = await forgotPassword(form.email);
            setInfo(res.message);
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setError("");
        try {
            const response = await signInWithPopup(auth, provider);
            // server ko sirf Firebase ID token bhejo — server usse verify karke name/email nikalega
            const idToken = await response.user.getIdToken();

            const res = await googleLogin(idToken);
            onLoggedIn(res.data.user);
        } catch (error) {
            // user ne khud popup band kiya — error dikhane ki zarurat nahi
            if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") return;
            console.error("Error during Google authentication:", error);
            setError(getErrorMessage(error));
        }
    };

    return (
        <div
            className={`w-full flex justify-center items-center px-6 ${
                isModel ? "py-4" : "min-h-screen py-20 bg-[#f3f3f3]"
            }`}
        >
            <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0 }}
                // "relative" — close button isi card ke corner par lagta hai
                className={`relative w-full ${
                    isModel ? "max-w-md" : "max-w-lg"
                } bg-white rounded-3xl shadow-lg p-8 border border-gray-200`}
            >
                {isModel && (
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl"
                    >
                        <FaTimes size={18} />
                    </button>
                )}

                <div className="flex items-center justify-center mb-6 gap-3">
                    <div className="bg-black text-white p-2 rounded-lg">
                        <FaRobot size={18} />
                    </div>
                    <h2>Ai_Interview_Agent</h2>
                </div>

                {mode === "forgot" ? (
                    // ---------- forgot password: email do, reset link aayega ----------
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold text-center mb-2">Forgot your password?</h1>
                        <p className="text-gray-500 text-sm md:text-base text-center mb-6">
                            Enter your email and we'll send you a link to set a new password.
                        </p>
                        <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                            <input
                                name="email"
                                type="email"
                                placeholder="Email"
                                autoComplete="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className={inputClass}
                            />
                            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                            {info && (
                                <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                                    {info}
                                    {import.meta.env.DEV && " (Dev: without SMTP the link is in the server terminal.)"}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors duration-300 disabled:opacity-60"
                            >
                                {loading ? "Sending..." : "Send reset link"}
                            </button>
                        </form>
                        <button
                            onClick={() => switchMode("login")}
                            className="mt-4 w-full text-sm text-gray-500 hover:text-black"
                        >
                            ← Back to login
                        </button>
                    </div>
                ) : mode === "check-email" ? (
                    // ---------- signup ke baad: inbox check karo ----------
                    <div className="text-center">
                        <MdMarkEmailRead className="mx-auto text-green-600 mb-4" size={56} />
                        <h1 className="text-xl md:text-2xl font-semibold mb-2">Check your inbox</h1>
                        <p className="text-gray-500 text-sm md:text-base mb-6">
                            We sent a verification link to <span className="font-medium text-black">{form.email}</span>.
                            Click it to activate your account. The link expires in 24 hours.
                        </p>
                        {import.meta.env.DEV && (
                            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                                Dev tip: if SMTP isn't set up, the link is printed in the server terminal.
                            </p>
                        )}
                        {info && <p className="text-sm text-green-600 mb-3">{info}</p>}
                        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                        <button
                            onClick={handleResend}
                            disabled={loading}
                            className="w-full border border-gray-300 py-2.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60"
                        >
                            {loading ? "Sending..." : "Resend link"}
                        </button>
                        <button
                            onClick={() => switchMode("login")}
                            className="mt-4 text-sm text-gray-500 hover:text-black"
                        >
                            ← Back to login
                        </button>
                    </div>
                ) : (
                    <>
                        <h1 className="text-xl text-center md:text-3xl font-semibold leading-snug mb-4">
                            {isRegister ? "Create your account" : "Continue With"}
                            <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex gap-2 items-center text-sm font-medium ml-2">
                                <RiSparkling2Fill />
                                AI Smart Interview
                            </span>
                        </h1>

                        <p className="text-center text-gray-500 text-sm md:text-base leading-relaxed mb-6">
                            Sign in to start your AI-powered mock interview, track your progress, and unlock
                            personalized feedback to enhance your interview skills.
                        </p>

                        {/* Login / Sign up tabs */}
                        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                            {["login", "register"].map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => switchMode(tab)}
                                    className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                                        mode === tab
                                            ? "bg-white shadow-sm font-medium"
                                            : "text-gray-500 hover:text-black"
                                    }`}
                                >
                                    {tab === "login" ? "Login" : "Sign up"}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {isRegister && (
                                <input
                                    name="name"
                                    placeholder="Full name"
                                    autoComplete="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    minLength={2}
                                    maxLength={50}
                                    className={inputClass}
                                />
                            )}
                            <input
                                name="email"
                                type="email"
                                placeholder="Email"
                                autoComplete="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className={inputClass}
                            />
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={isRegister ? "Password (min 8 characters)" : "Password"}
                                    // browser ka password manager sahi suggestion de: naya password vs saved password
                                    autoComplete={isRegister ? "new-password" : "current-password"}
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    minLength={isRegister ? 8 : undefined}
                                    maxLength={72}
                                    className={`${inputClass} pr-11`}
                                />
                                <button
                                    type="button" // type="button" warna ye bhi form submit kar deta
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            {!isRegister && (
                                <button
                                    type="button"
                                    onClick={() => switchMode("forgot")}
                                    className="-mt-2 self-end text-xs text-gray-500 hover:text-black"
                                >
                                    Forgot password?
                                </button>
                            )}

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                                    {error}
                                    {needsVerification && (
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={loading}
                                            className="block mt-1 font-medium underline disabled:opacity-60"
                                        >
                                            Resend verification link
                                        </button>
                                    )}
                                </div>
                            )}
                            {info && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{info}</p>}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ opacity: 0.9, scale: 1.02 }}
                                whileTap={{ opacity: 1.0, scale: 0.98 }}
                                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors duration-300 disabled:opacity-60"
                            >
                                {loading ? "Please wait..." : isRegister ? "Create account" : "Login"}
                            </motion.button>
                        </form>

                        <div className="flex items-center gap-3 my-5 text-xs text-gray-400">
                            <div className="flex-1 h-px bg-gray-200" />
                            OR
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <motion.button
                            onClick={handleGoogleAuth}
                            whileHover={{ opacity: 0.9, scale: 1.02 }}
                            whileTap={{ opacity: 1.0, scale: 0.98 }}
                            className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-300 flex items-center justify-center gap-2"
                        >
                            <FcGoogle />
                            Continue with Google
                        </motion.button>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default Auth;

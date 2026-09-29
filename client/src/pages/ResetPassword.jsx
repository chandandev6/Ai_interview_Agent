// email ke "reset password" link se yaha aate hai: /reset-password?token=... → naya password → login
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import { setUserData } from "../redux/userSlice.js";
import { resetPassword } from "../api/auth.api.js";
import getErrorMessage from "../utils/getErrorMessage.js";

const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black";

function ResetPassword() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(token ? "" : "This reset link is invalid. Please request a new one.");
    const [done, setDone] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        // dono same hai ye check browser me hi — server ko sirf ek password chahiye
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }
        setLoading(true);
        try {
            const res = await resetPassword({ token, password });
            dispatch(setUserData(res.data.user)); // server ne cookie de di — ab logged in
            setDone(true);
            setTimeout(() => navigate("/"), 2000);
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3] px-6">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 max-w-md w-full">
                {done ? (
                    <div className="text-center">
                        <FaCheckCircle className="mx-auto text-green-600 mb-4" size={52} />
                        <h1 className="text-xl font-semibold mb-2">Password updated!</h1>
                        <p className="text-gray-500 text-sm">You're logged in. Taking you home...</p>
                    </div>
                ) : (
                    <>
                        <h1 className="text-xl md:text-2xl font-semibold text-center mb-2">Set a new password</h1>
                        <p className="text-gray-500 text-sm text-center mb-6">
                            Choose a password with at least 8 characters.
                        </p>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="New password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    maxLength={72}
                                    disabled={!token}
                                    className={`${inputClass} pr-11`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={!token}
                                className={inputClass}
                            />

                            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading || !token}
                                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors duration-300 disabled:opacity-60"
                            >
                                {loading ? "Saving..." : "Update password"}
                            </button>
                        </form>
                        <button
                            onClick={() => navigate("/auth")}
                            className="mt-4 w-full text-sm text-gray-500 hover:text-black"
                        >
                            ← Back to login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default ResetPassword;

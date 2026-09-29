// email ke link se yaha aate hai: /verify-email?token=... → server ko token bhejo → verified + login
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { setUserData } from "../redux/userSlice.js";
import { verifyEmail } from "../api/auth.api.js";
import getErrorMessage from "../utils/getErrorMessage.js";

function VerifyEmail() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    // "verifying" | "success" | "error"
    const [status, setStatus] = useState(token ? "verifying" : "error");
    const [message, setMessage] = useState(token ? "" : "This verification link is invalid.");
    const alreadyCalled = useRef(false);

    useEffect(() => {
        // dev me StrictMode effect 2 baar chalata hai — link ek hi baar kaam karta hai, isliye sirf pehli baar bhejo
        if (!token || alreadyCalled.current) return;
        alreadyCalled.current = true;

        const verify = async () => {
            try {
                const res = await verifyEmail(token);
                dispatch(setUserData(res.data.user)); // server ne cookie bhi de di — ab logged in
                setStatus("success");
                setTimeout(() => navigate("/"), 2000);
            } catch (error) {
                setStatus("error");
                setMessage(getErrorMessage(error));
            }
        };
        verify();
    }, [token, dispatch, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3] px-6">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
                {status === "verifying" && (
                    <>
                        <div className="w-12 h-12 mx-auto mb-4 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                        <h1 className="text-xl font-semibold">Verifying your email...</h1>
                    </>
                )}
                {status === "success" && (
                    <>
                        <FaCheckCircle className="mx-auto text-green-600 mb-4" size={52} />
                        <h1 className="text-xl font-semibold mb-2">Email verified!</h1>
                        <p className="text-gray-500 text-sm">You're logged in. Taking you home...</p>
                    </>
                )}
                {status === "error" && (
                    <>
                        <FaTimesCircle className="mx-auto text-red-500 mb-4" size={52} />
                        <h1 className="text-xl font-semibold mb-2">Verification failed</h1>
                        <p className="text-gray-500 text-sm mb-6">{message}</p>
                        <button
                            onClick={() => navigate("/auth")}
                            className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-800"
                        >
                            Go to login
                        </button>
                        <p className="text-xs text-gray-400 mt-3">
                            Try logging in — if your email isn't verified yet, you can request a new link there.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default VerifyEmail;

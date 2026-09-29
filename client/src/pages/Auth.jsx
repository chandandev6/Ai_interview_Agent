import { FaRobot } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa"; // needed for the modal close button now living here
import { RiSparkling2Fill } from "react-icons/ri";
import { FcGoogle } from "react-icons/fc";
import { motion } from "motion/react";
import { auth, provider } from "../utils/firebase";
import { signInWithPopup } from "firebase/auth";
import axios from "axios";
import { serverUrl } from "../config/server.js";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUserData } from "../redux/userSlice.js";

function Auth({ isModel = false, onClose }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleGoogleAuth = async () => {
        try {
            const response = await signInWithPopup(auth, provider);
            // server ko sirf Firebase ID token bhejo — server usse verify karke name/email nikalega
            const idToken = await response.user.getIdToken();

            const result = await axios.post(
                serverUrl + "/api/auth/google",
                { idToken },
                { withCredentials: true }
            );
            dispatch(setUserData(result.data.data.user));
            if (!isModel) navigate("/");
        } catch (error) {
            console.error("Error during Google authentication:", error);
            dispatch(setUserData(null));
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
                // "relative" added here — the close button below is positioned
                // absolute *against this card*, not against some outer wrapper,
                // so it's guaranteed to land on the card's actual corner
                className={`relative w-full ${
                    isModel ? "max-w-md" : "max-w-lg"
                } bg-white rounded-3xl shadow-lg p-8 shadow-sm border border-gray-200`}
            >
                {isModel && (
                    <button
                        onClick={onClose}
                        // top-4 right-4 sits it just inside the card's own padding —
                        // since it's a child of the card, this is relative to the
                        // card's edges, not some differently-sized parent box
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

                <h1 className="text-xl text-center md:text-3xl font-semibold leading-snug mb-4">
                    Continue With
                    <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex gap-2 items-center text-sm font-medium ml-2">
                        <RiSparkling2Fill />
                        AI Smart Interview
                    </span>
                </h1>

                <p className="text-center text-gray-500 text-sm md:text-base leading-relaxed mb-8">
                    Sign in to start your AI-powered mock interview, track your progress,
                    and unlock personalized feedback to enhance your interview skills.
                </p>

                <motion.button
                    onClick={handleGoogleAuth}
                    whileHover={{ opacity: 0.9, scale: 1.05 }}
                    whileTap={{ opacity: 1.0, scale: 0.95 }}
                    className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors duration-300 flex items-center justify-center gap-2"
                >
                    <FcGoogle />
                    Continue with Google
                </motion.button>
            </motion.div>
        </div>
    );
}

export default Auth;
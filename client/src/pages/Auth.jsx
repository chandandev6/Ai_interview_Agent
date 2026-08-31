import React from "react";
import { FaRobot } from "react-icons/fa6";
import { RiSparkling2Fill } from "react-icons/ri";
import { FcGoogle } from "react-icons/fc";
import { motion } from "motion/react";
import { auth, provider } from "../utils/firebase";
import { signInWithPopup } from "firebase/auth";
import axios from "axios";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice.js";



function Auth(isModel = false) {

  const dispatch = useDispatch();
  const handleGoogleAuth = async () => {
    try {
      const response = await signInWithPopup(auth, provider);
      let user = response.user;
      let name = user.displayName;
      let email = user.email;

      const result = await axios.post(serverUrl + "/api/auth/google", {
        name,email,}, {withCredentials: true,});
        // console.log("Server response:", result);
      dispatch(setUserData(result.data.user));
    } catch (error) {
      console.error("Error during Google authentication:", error);
      dispatch(setUserData(null)); // Clear user data on error
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 shadow-2xl border border-gray-200"
      >
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
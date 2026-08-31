import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { motion } from "motion/react";
import { BsRobot, BsCoin } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { FaUserAstronaut } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice.js";
import axios from "axios";

function Navbar() {
    const userData = useSelector((state) => state.user.userData);

    const [showCreditPopup, setShowCreditPopup] = useState(false);
    const [showUserPopup, setShowUserPopup] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const handleLogout = async () => {
        try{
            await axios.post(serverUrl + "/api/auth/logout", null ,{
                withCredentials: true,
            });
            dispatch(setUserData(null)); // Clear user data on logout
            setShowUserPopup(false); // Close the user popup
            setShowCreditPopup(false); // Close the credit popup
            navigate("/"); // Redirect to the authentication page
        }
        catch(error){
            console.error("Error during logout:", error);
        }
    }

    return (
        <div className='bg-[#f3f3f3] flex justify-center items-center w-full h-20 px-8 py-4'>

            <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5 }}
                className='w-full max-w-6xl bg-white rounded-3xl shadow-lg p-8 shadow-sm border border-gray-200 justify-between flex items-center relative px-8 py-4'
            >

                <div className='flex items-center gap-3 cursor-pointer'>
                    <div className='bg-black text-white p-2 rounded-lg'>
                        <BsRobot size={18} />
                    </div>

                    <h1 className='text-2xl font-bold'>
                        Ai_Interview_Agent
                    </h1>
                </div>

                <div className='flex items-center gap-6 relative'>

                    <div className='relative'>
                        <button
                            onClick={() => {setShowCreditPopup(!showCreditPopup)
                                setShowUserPopup(false)
                            }}
                            className='flex items-center gap-2 bg-green-200 px-4 py-2 rounded-full text-md hover:bg-green-300 transition-colors duration-300'
                        >
                            {userData ? userData?.credit : 0}
                            <BsCoin />
                        </button>
                    </div>

                        {showCreditPopup && (
                            <div className='absolute top-12 right-[-0px] mt-3 w-64 bg-white shadow-xl border border-gray-200 rounded p-5  rounded-xl z-50'>
                                <p className='text-sm text-gray-600 mb-4'>
                                    Need more credits to continue interviews?
                                </p>

                                <button onClick={()=>navigate("/pricing") } className='w-full bg-black text-white py-2 rounded-lg text-sm'>
                                    Buy more credits
                                </button>
                            </div>
                        )}

                    <div className='relative'>
                        <button
                            onClick={() => {setShowUserPopup(!showUserPopup)
                                setShowCreditPopup(false)
                            }}
                            className='w-9 h-9 bg-black text-white rounded-full flex items-center justify-center font-semibold text-sm'
                        >
                            {userData
                                ? userData?.name.slice(0, 1).toUpperCase()
                                : <FaUserAstronaut size={18} />
                            }
                        </button>

                        {showUserPopup && (
                            <div className='absolute top-12 right-0 mt-3 w-64 bg-white shadow-xl border border-gray-200 rounded p-5  rounded-xl z-50'>
                                <p className='text-md text-blue-500 font-medium mb-1'>{userData?.name}</p>
                                    <button className='w-full text-left text-sm py-2 hover:text-black text-gray-600'>
                                        Interview History
                                    </button>
                                    <button onClick={handleLogout} className='w-full text-left text-sm py-2 hover:text-black text-red-500 flex items-center gap-2'>
                                        <HiOutlineLogout />
                                        Logout
                                    </button>
                            </div>
                        )}
                    </div>

                </div>

            </motion.div>
        </div>
    )
}

export default Navbar
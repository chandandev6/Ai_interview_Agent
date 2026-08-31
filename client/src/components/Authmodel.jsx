import React from 'react'
import { useSelector } from 'react-redux'
import { useEffect } from 'react';
import { FaTimes } from "react-icons/fa";
import Auth from '../pages/Auth';

function Authmodel({onClose}) {

    const {userData} = useSelector((state) => state.user.userData);

    useEffect(() => {
        if (userData) {
            onClose(); // Close the Authmodel if userData is available
        }
    }, [userData, onClose]);
  return (
    <div className='fixed inset-0 bg-black/10  flex justify-center items-center z-[999]backdrop-blur-sm px-6 py-20'>
        <div className='relative w-full max-w-md'>
            <button className='absolute top-8 right-5 text-gray-800 hover:text-black-700 text-xl'>

                <FaTImes size={18}/>
            </button>
            <Auth isModel={true}/>
        </div>
    </div>
  )
}

export default Authmodel
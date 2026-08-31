import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUserData } from "./redux/userSlice.js";

export const serverUrl = "http://localhost:8000"; 

function App() {
  const dispatch = useDispatch();
  useEffect(() =>{ 
    const getUser = async () => {
      try {
        const result = await axios.get(serverUrl + "/api/user/current-user", {
          withCredentials: true,
        });
        // console.log(result.data.user);
        dispatch(setUserData(result.data.user));
      }
      catch (error) {
        console.error("Error fetching user:", error);
        dispatch(setUserData(null)); // Clear user data on error
      }

    }

    getUser();
  } , [])
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
    </Routes>
  );
}

export default App;
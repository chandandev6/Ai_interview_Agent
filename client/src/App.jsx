import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Interviewpage from "./pages/Interviewpage";
import Interviewreport from "./pages/Interviewreport";
import VerifyEmail from "./pages/VerifyEmail";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUserData } from "./redux/userSlice.js";
import { serverUrl } from "./config/server.js";

function App() {
  const dispatch = useDispatch();
  useEffect(() =>{ 
    const getUser = async () => {
      try {
        const result = await axios.get(serverUrl + "/api/user/current-user", {
          withCredentials: true,
        });
        // console.log(result.data.data.user);
        dispatch(setUserData(result.data.data.user));
      }
      catch (error) {
        // 401 = logged in nahi — userData pehle se null hai. Yaha null dispatch MAT karo:
        // ye response late aaya to abhi-abhi login/verify hua user logout ho jaata (race condition)
        if (error.response?.status !== 401) console.error("Error fetching user:", error);
      }

    }

    getUser();
  } , [dispatch])
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/interview" element={<Interviewpage />} />
      <Route path="/report/:id" element={<Interviewreport />} />
      {/* TODO: /history, /pricing pages banana baaki hai (Navbar/Home se link hai) */}
    </Routes>
  );
}

export default App;
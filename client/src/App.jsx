import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Interviewpage from "./pages/Interviewpage";
import Interviewreport from "./pages/Interviewreport";
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
        console.error("Error fetching user:", error);
        dispatch(setUserData(null)); // Clear user data on error
      }

    }

    getUser();
  } , [dispatch])
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/interview" element={<Interviewpage />} />
      <Route path="/report/:id" element={<Interviewreport />} />
      {/* TODO: /history, /pricing pages banana baaki hai (Navbar/Home se link hai) */}
    </Routes>
  );
}

export default App;
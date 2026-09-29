import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import Home from "./pages/Home";
import PageLoader from "./components/PageLoader";
import ProtectedRoute from "./components/ProtectedRoute";
import { getCurrentUser } from "./api/user.api.js";
import { setUserData, finishLoading } from "./redux/userSlice.js";

// baaki pages lazy — har page ki alag JS file, tabhi download jab user us page par jaaye
// (Home landing page hai, wo turant chahiye — isliye normal import)
const Auth = lazy(() => import("./pages/Auth"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Interviewpage = lazy(() => import("./pages/Interviewpage"));
const Interviewreport = lazy(() => import("./pages/Interviewreport"));

function App() {
    const dispatch = useDispatch();

    // app khulte hi: cookie valid hai to user lao
    useEffect(() => {
        const loadUser = async () => {
            try {
                const res = await getCurrentUser();
                dispatch(setUserData(res.data.user));
            } catch (error) {
                // 401 = logged in nahi — bas loading khatam. null dispatch MAT karo:
                // ye response late aaya to abhi-abhi login/verify hua user logout ho jaata (race condition)
                if (error.response?.status !== 401) console.error("Error fetching user:", error);
                dispatch(finishLoading());
            }
        };
        loadUser();
    }, [dispatch]);

    return (
        // lazy page ki file aa rahi ho tab tak spinner
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* login zaruri — naye private pages (/history, /pricing...) bhi aise hi wrap karna */}
                <Route
                    path="/interview"
                    element={
                        <ProtectedRoute>
                            <Interviewpage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/report/:id"
                    element={
                        <ProtectedRoute>
                            <Interviewreport />
                        </ProtectedRoute>
                    }
                />
                {/* TODO: /history, /pricing pages banana baaki hai (Navbar/Home se link hai) */}
            </Routes>
        </Suspense>
    );
}

export default App;

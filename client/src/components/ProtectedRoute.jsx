// private pages ka gatekeeper (sirf UX ke liye) — asli security server ka isAuth hai
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import PageLoader from "./PageLoader";

function ProtectedRoute({ children }) {
    const { userData, loading } = useSelector((state) => state.user);
    const location = useLocation();

    // abhi current-user ka jawab nahi aaya — faisla mat karo, warna refresh par logged-in user bhi bahar
    if (loading) return <PageLoader />;

    // logged in nahi → login page; "from" yaad rakho taaki login ke baad wapas yahi aaye
    if (!userData) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;

    return children;
}

export default ProtectedRoute;

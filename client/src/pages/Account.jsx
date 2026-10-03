import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BsCoin, BsArrowUpRight, BsArrowDownRight } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import Navbar from "../components/Navbar";
import { getTransactions } from "../api/credit.api.js";
import { getCurrentUser } from "../api/user.api.js";
import { logoutUser } from "../api/auth.api.js";
import { logout, setUserData } from "../redux/userSlice.js";
import getErrorMessage from "../utils/getErrorMessage.js";
import { INTERVIEW_COST } from "../constants/interview.js";

const PAGE_SIZE = 10;

const TYPE_LABEL = {
    signup_bonus: "Welcome bonus",
    interview: "Interview",
    refund: "Refund",
    purchase: "Credits purchased",
};

// /account — balance, credits ki passbook, logout
function Account() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state) => state.user.userData);

    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // balance taaza karo — webhook ne abhi credits diye ho (verify fail hua tha) to yaha dikh jaaye
    useEffect(() => {
        getCurrentUser()
            .then((res) => dispatch(setUserData(res.data.user)))
            .catch(() => {});
    }, [dispatch]);

    useEffect(() => {
        let cancelled = false;
        getTransactions({ page, limit: PAGE_SIZE })
            .then((res) => {
                if (cancelled) return;
                setItems((prev) => (page === 1 ? res.data.items : [...prev, ...res.data.items]));
                setPagination(res.data.pagination);
                setError("");
            })
            .catch((err) => !cancelled && setError(getErrorMessage(err)))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [page]);

    const handleLogout = async () => {
        try {
            await logoutUser();
        } finally {
            dispatch(logout()); // ProtectedRoute "loggedOut" dekh ke home par bhej deta hai
        }
    };

    const hasMore = pagination && page < pagination.totalPages;

    return (
        <div className="min-h-screen bg-[#f3f3f3]">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
                <h1 className="text-3xl font-semibold">Account</h1>

                <div className="grid sm:grid-cols-2 gap-4">
                    {/* profile */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
                        <div className="w-14 h-14 shrink-0 bg-black text-white rounded-full flex items-center justify-center text-xl font-semibold">
                            {user?.name?.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">{user?.name}</p>
                            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1.5 shrink-0"
                        >
                            <HiOutlineLogout /> Logout
                        </button>
                    </div>

                    {/* balance */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Credit balance</p>
                            <p className="text-3xl font-semibold flex items-center gap-2 mt-1">
                                {user?.credit ?? "–"} <BsCoin className="text-green-600 text-2xl" />
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Enough for {Math.floor((user?.credit ?? 0) / INTERVIEW_COST)} interviews
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/pricing")}
                            className="bg-black text-white px-4 py-2.5 rounded-xl text-sm hover:bg-gray-800 shrink-0"
                        >
                            Buy credits
                        </button>
                    </div>
                </div>

                {/* passbook */}
                <div className="bg-white rounded-2xl border border-gray-200">
                    <h2 className="font-semibold p-5 pb-3">Credit history</h2>
                    {loading && items.length === 0 ? (
                        <div className="px-5 pb-5 space-y-3 animate-pulse">
                            {[0, 1, 2].map((n) => (
                                <div key={n} className="h-12 bg-gray-100 rounded-lg" />
                            ))}
                        </div>
                    ) : error && items.length === 0 ? (
                        <p className="px-5 pb-5 text-sm text-red-600">{error}</p>
                    ) : items.length === 0 ? (
                        <p className="px-5 pb-5 text-sm text-gray-500">No credit activity yet.</p>
                    ) : (
                        <ul>
                            {items.map((item) => {
                                const positive = item.amount > 0;
                                return (
                                    <li
                                        key={item._id}
                                        className="flex items-center gap-3 px-5 py-3 border-t border-gray-100"
                                    >
                                        <span
                                            className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
                                                positive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                            {positive ? <BsArrowDownRight /> : <BsArrowUpRight />}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{TYPE_LABEL[item.type] ?? item.type}</p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {new Date(item.createdAt).toLocaleString(undefined, {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })}
                                                {item.note ? ` · ${item.note}` : ""}
                                            </p>
                                        </div>
                                        <div className="text-right tabular-nums">
                                            <p
                                                className={`text-sm font-semibold ${positive ? "text-green-700" : "text-gray-900"}`}
                                            >
                                                {positive ? "+" : ""}
                                                {item.amount}
                                            </p>
                                            <p className="text-xs text-gray-400">Balance {item.balanceAfter}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {hasMore && (
                        <div className="p-4 border-t border-gray-100 text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setLoading(true);
                                    setPage((p) => p + 1);
                                }}
                                disabled={loading}
                                className="text-sm border border-gray-300 px-5 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50"
                            >
                                {loading ? "Loading…" : "Load more"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Account;

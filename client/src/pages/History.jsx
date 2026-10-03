import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { BsClockHistory, BsPlayFill } from "react-icons/bs";
import Navbar from "../components/Navbar";
import { getHistory } from "../api/interview.api.js";
import { resetInterview } from "../redux/interviewSlice.js";
import { saveActiveInterview } from "../utils/activeInterview.js";
import getErrorMessage from "../utils/getErrorMessage.js";
import { MODE_LABEL, MODES } from "../constants/interview.js";

const PAGE_SIZE = 9; // 3 column grid — har "Load more" par ek poori line set

const FILTERS = [{ key: "", title: "All" }, ...MODES];

const scoreColor = (score) => (score >= 70 ? "text-green-600" : score >= 40 ? "text-amber-600" : "text-red-600");

const STATUS_BADGE = {
    in_progress: { text: "In progress", className: "bg-blue-50 text-blue-700" },
    finishing: { text: "Preparing report", className: "bg-blue-50 text-blue-700" },
    abandoned: { text: "Abandoned", className: "bg-gray-100 text-gray-500" },
};

function HistoryCard({ item, onOpen }) {
    const completed = item.status === "completed";
    const badge = STATUS_BADGE[item.status];
    return (
        <motion.button
            type="button"
            onClick={() => onOpen(item)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            className="text-left bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow flex flex-col"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-semibold truncate">{item.role}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {MODE_LABEL[item.mode]} · {item.experience}
                    </p>
                </div>
                {completed ? (
                    <span className={`text-2xl font-bold ${scoreColor(item.report?.overallScore ?? 0)}`}>
                        {item.report?.overallScore ?? 0}
                        <span className="text-xs text-gray-400 font-normal">/100</span>
                    </span>
                ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${badge?.className}`}>
                        {badge?.text ?? item.status}
                    </span>
                )}
            </div>
            <div className="flex items-center justify-between mt-auto pt-5 text-xs text-gray-500">
                <span>
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                    })}
                </span>
                <span className="font-medium text-black flex items-center gap-1">
                    {completed ? (
                        "View report →"
                    ) : item.status === "in_progress" ? (
                        <>
                            <BsPlayFill /> Continue
                        </>
                    ) : (
                        ""
                    )}
                </span>
            </div>
        </motion.button>
    );
}

// /history — apne interviews, newest first, mode filter + "Load more" (server pagination)
function History() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [mode, setMode] = useState("");
    const [page, setPage] = useState(1);
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0); // "Try again" ke liye

    useEffect(() => {
        let cancelled = false;
        getHistory({ page, limit: PAGE_SIZE, mode: mode || undefined })
            .then((res) => {
                if (cancelled) return;
                // page 1 = naya list (filter badla), aage ke pages = purane ke neeche jodo
                setItems((prev) => (page === 1 ? res.data.items : [...prev, ...res.data.items]));
                setPagination(res.data.pagination);
                setError("");
            })
            .catch((err) => !cancelled && setError(getErrorMessage(err)))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [mode, page, reloadKey]);

    const changeFilter = (key) => {
        if (key === mode) return;
        setMode(key);
        setPage(1);
        setItems([]);
        setLoading(true);
    };

    const loadMore = () => {
        setLoading(true);
        setPage((p) => p + 1);
    };

    const retry = () => {
        setError("");
        setLoading(true);
        setReloadKey((k) => k + 1);
    };

    const openItem = (item) => {
        if (item.status === "completed") return navigate(`/report/${item._id}`);
        if (item.status === "in_progress") {
            // Interviewpage refresh wala restore yahi id uthayega aur wahi se continue karega
            saveActiveInterview({ interviewId: item._id, avatar: "female" });
            dispatch(resetInterview());
            navigate("/interview");
        }
    };

    const hasMore = pagination && page < pagination.totalPages;
    const firstLoad = loading && items.length === 0;

    return (
        <div className="min-h-screen bg-[#f3f3f3]">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-semibold">Interview history</h1>
                        <p className="text-gray-500 mt-1">
                            {pagination ? `${pagination.total} interview${pagination.total === 1 ? "" : "s"}` : " "}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/interview")}
                        className="bg-black text-white px-5 py-2.5 rounded-xl text-sm hover:bg-gray-800 self-start sm:self-auto"
                    >
                        New interview
                    </button>
                </div>

                {/* mode filter */}
                <div className="flex gap-2 overflow-x-auto pb-1 mb-6" role="tablist">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.key}
                            role="tab"
                            aria-selected={mode === filter.key}
                            onClick={() => changeFilter(filter.key)}
                            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors ${
                                mode === filter.key
                                    ? "bg-black text-white border-black"
                                    : "bg-white border-gray-200 hover:border-gray-400"
                            }`}
                        >
                            {filter.title}
                        </button>
                    ))}
                </div>

                {error && items.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button onClick={retry} className="bg-black text-white px-6 py-3 rounded-xl">
                            Try again
                        </button>
                    </div>
                ) : firstLoad ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                        {Array.from({ length: 6 }, (_, n) => (
                            <div key={n} className="h-36 bg-white rounded-2xl border border-gray-200" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
                        <BsClockHistory size={36} className="mx-auto text-gray-300 mb-3" />
                        <p className="font-medium">
                            {mode ? `No ${MODE_LABEL[mode]} interviews yet` : "No interviews yet"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 mb-5">
                            Your finished interviews and reports show up here.
                        </p>
                        <button
                            onClick={() => navigate("/interview")}
                            className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800"
                        >
                            Start your first interview
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((item) => (
                                <HistoryCard key={item._id} item={item} onOpen={openItem} />
                            ))}
                        </div>
                        {error && <p className="text-sm text-red-600 text-center mt-4">{error}</p>}
                        {(hasMore || error) && (
                            <div className="text-center mt-8">
                                <button
                                    onClick={error ? retry : loadMore}
                                    disabled={loading}
                                    className="border border-gray-300 bg-white px-6 py-2.5 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {loading ? "Loading…" : error ? "Try again" : "Load more"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default History;

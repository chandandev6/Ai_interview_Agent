import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Step3report from "../components/Step3report";
import { getInterview } from "../api/interview.api.js";
import getErrorMessage from "../utils/getErrorMessage.js";

// /report/:id — finish ke baad yaha aate hai (interview state me saath aata hai, dobara fetch nahi).
// Refresh / history se aaye to server se lao
function Interviewreport() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const passed = location.state?.interview;

    const [interview, setInterview] = useState(passed?._id === id ? passed : null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (interview?._id === id) return;
        let cancelled = false;
        getInterview(id)
            .then((res) => !cancelled && setInterview(res.data.interview))
            .catch((err) => !cancelled && setError(getErrorMessage(err)));
        return () => {
            cancelled = true;
        };
    }, [id, interview]);

    let content;
    if (error) {
        content = (
            <div className="max-w-md mx-auto text-center py-24 px-4">
                <p className="text-red-600 mb-4">{error}</p>
                <button onClick={() => navigate("/interview")} className="bg-black text-white px-6 py-3 rounded-xl">
                    Start an interview
                </button>
            </div>
        );
    } else if (!interview) {
        // skeleton — layout jaisa hi, taaki data aane par page "kude" nahi
        content = (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6 animate-pulse">
                <div className="h-56 bg-white rounded-3xl border border-gray-200" />
                <div className="grid md:grid-cols-3 gap-4">
                    {[0, 1, 2].map((n) => (
                        <div key={n} className="h-40 bg-white rounded-2xl border border-gray-200" />
                    ))}
                </div>
            </div>
        );
    } else if (interview.status !== "completed" || !interview.report) {
        content = (
            <div className="max-w-md mx-auto text-center py-24 px-4">
                <p className="text-gray-600 mb-4">This interview is not finished yet, so there is no report.</p>
                <button onClick={() => navigate("/interview")} className="bg-black text-white px-6 py-3 rounded-xl">
                    Go to interview
                </button>
            </div>
        );
    } else {
        content = <Step3report interview={interview} />;
    }

    return (
        <div className="min-h-screen bg-[#f3f3f3]">
            <Navbar />
            {content}
        </div>
    );
}

export default Interviewreport;

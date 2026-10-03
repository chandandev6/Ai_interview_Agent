// live interview: avatar (left) + current question (right). Saare questions ho gaye → /finish → report page
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BsPlayFill } from "react-icons/bs";
import { finishInterview } from "../api/interview.api.js";
import { resetInterview, resumeConfirmed } from "../redux/interviewSlice.js";
import useSpeechSynthesis from "../hooks/useSpeechSynthesis.js";
import { clearActiveInterview } from "../utils/activeInterview.js";
import getErrorMessage from "../utils/getErrorMessage.js";
import { AVATARS } from "../constants/interview.js";
import QuestionRound from "./interview/QuestionRound.jsx";

const RETRY_EVALUATING_MS = 3000; // aakhri answer abhi check ho raha ho (409) to itni der baad dobara finish

function Step2interview() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { interviewId, questions, currentIndex, avatar, resumed } = useSelector((state) => state.interview);
    const tts = useSpeechSynthesis(avatar);
    const videoRef = useRef(null);

    const total = questions.length;
    const allAnswered = currentIndex >= total;
    const [finishError, setFinishError] = useState("");
    const [finishAttempt, setFinishAttempt] = useState(0); // badhao = finish dobara try
    // ek attempt = ek hi request (dev me StrictMode effect do baar chalata hai — dusri baar wahi promise)
    const finishRequestRef = useRef({ attempt: -1, promise: null });

    // AI bol raha hai tabhi avatar ki video chale — "baat kar raha hai" jaisa lage
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (tts.speaking) video.play().catch(() => {});
        else video.pause();
    }, [tts.speaking]);

    // refresh / tab band → "Are you sure?" (browser apna message dikhata hai)
    useEffect(() => {
        const warn = (e) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, []);

    // sab answer ho gaye → finish (report). Fail par retry button; 409 "abhi evaluate ho raha" par khud retry
    useEffect(() => {
        if (!allAnswered) return;
        let cancelled = false;
        let retryTimer;
        if (finishRequestRef.current.attempt !== finishAttempt) {
            finishRequestRef.current = { attempt: finishAttempt, promise: finishInterview(interviewId) };
        }
        finishRequestRef.current.promise
            .then((res) => {
                if (cancelled) return;
                clearActiveInterview();
                const { interview } = res.data;
                dispatch(resetInterview());
                navigate(`/report/${interview._id}`, { replace: true, state: { interview } });
            })
            .catch((err) => {
                if (cancelled) return;
                const code = err.response?.data?.code;
                if (code === "ANSWER_BEING_EVALUATED" || code === "INTERVIEW_FINISHING") {
                    retryTimer = setTimeout(() => setFinishAttempt((n) => n + 1), RETRY_EVALUATING_MS);
                    return;
                }
                setFinishError(getErrorMessage(err));
            });
        return () => {
            cancelled = true;
            clearTimeout(retryTimer);
        };
    }, [allAnswered, finishAttempt, interviewId, dispatch, navigate]);

    const avatarVideo = AVATARS.find((item) => item.key === avatar)?.video ?? AVATARS[0].video;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
            {/* progress */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Interview in progress</span>
                    <span>
                        {Math.min(currentIndex, total)}/{total} answered
                    </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-black transition-all duration-500"
                        style={{ width: `${(Math.min(currentIndex, total) / total) * 100}%` }}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-5 gap-6">
                {/* avatar */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl border border-gray-200 p-3 md:sticky md:top-6">
                        <video
                            ref={videoRef}
                            src={avatarVideo}
                            muted
                            loop
                            playsInline
                            preload="auto"
                            className="w-full aspect-square md:aspect-[4/5] object-cover rounded-xl bg-gray-100"
                        />
                        <div className="flex items-center justify-between px-1 pt-3">
                            <span className="text-sm font-medium">AI Interviewer</span>
                            <span
                                className={`text-xs flex items-center gap-1.5 ${tts.speaking ? "text-green-600" : "text-gray-400"}`}
                            >
                                <span
                                    className={`w-2 h-2 rounded-full ${tts.speaking ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
                                />
                                {tts.speaking ? "Speaking" : "Listening"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* question / finishing */}
                <div className="md:col-span-3">
                    {resumed && !allAnswered ? (
                        // refresh ke baad — browser bina click ke awaaz/mic shuru nahi karne deta
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                            <h2 className="text-xl font-semibold mb-2">Welcome back</h2>
                            <p className="text-gray-500 mb-6">
                                Your interview is saved. You are on question {currentIndex + 1} of {total}.
                            </p>
                            <button
                                type="button"
                                onClick={() => dispatch(resumeConfirmed())}
                                className="bg-black text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 hover:bg-gray-800"
                            >
                                <BsPlayFill /> Continue interview
                            </button>
                        </div>
                    ) : allAnswered ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                            {finishError ? (
                                <>
                                    <p className="text-red-600 mb-4">{finishError}</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFinishError("");
                                            setFinishAttempt((n) => n + 1);
                                        }}
                                        className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800"
                                    >
                                        Try again
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="inline-block w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4" />
                                    <h2 className="text-xl font-semibold">Preparing your report…</h2>
                                    <p className="text-gray-500 mt-1">
                                        The AI is reviewing all your answers (up to 30 s).
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <QuestionRound
                            key={currentIndex}
                            interviewId={interviewId}
                            index={currentIndex}
                            total={total}
                            question={questions[currentIndex]}
                            speak={tts.speak}
                            cancelSpeech={tts.cancel}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Step2interview;

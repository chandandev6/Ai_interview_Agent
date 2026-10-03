// ek question ka poora cycle: AI bolta hai → user bolta/likhta hai (timer) → submit → score
// parent ise key={index} deta hai — naya question = naya component = saara state apne aap reset
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { BsMic, BsMicMute, BsArrowRepeat } from "react-icons/bs";
import { getInterview, submitAnswer } from "../../api/interview.api.js";
import { answerEvaluated } from "../../redux/interviewSlice.js";
import useSpeechRecognition from "../../hooks/useSpeechRecognition.js";
import useCountdown from "../../hooks/useCountdown.js";
import getErrorMessage from "../../utils/getErrorMessage.js";

const DIFFICULTY_STYLE = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    hard: "bg-red-100 text-red-700",
};

const joinText = (current, chunk) => (current ? `${current} ${chunk}` : chunk);

const average = (scores) => Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / 4) * 10) / 10;

function QuestionRound({ interviewId, index, total, question, speak, cancelSpeech }) {
    const dispatch = useDispatch();

    // speaking → answering → submitting (fail → error, wahi se retry)
    const [phase, setPhase] = useState("speaking");
    const [answer, setAnswerState] = useState("");
    const [error, setError] = useState("");

    // async kaam (timer khatam, mic ka aakhri tukda) ko hamesha latest value chahiye — isliye refs bhi
    const answerRef = useRef("");
    const phaseRef = useRef("speaking");
    const timeTakenRef = useRef(0);

    const setAnswer = (text) => {
        answerRef.current = text;
        setAnswerState(text);
    };
    const changePhase = (next) => {
        phaseRef.current = next;
        setPhase(next);
    };

    const mic = useSpeechRecognition((chunk) => setAnswer(joinText(answerRef.current, chunk)));
    // 0 par auto-submit. submit neeche bana hai, isliye ref se (hamesha latest wala)
    const submitRef = useRef(null);
    const timer = useCountdown(() => submitRef.current?.());

    // AI question bolta hai, phir answer ka time + mic shuru (phase pehle se "speaking" hona chahiye)
    const askQuestion = async () => {
        await speak(`Question ${index + 1}. ${question.question}`);
        if (phaseRef.current !== "speaking") return; // beech me unmount / skip ho gaya
        changePhase("answering");
        timer.start(question.timeLimitSec);
        mic.start();
    };

    useEffect(() => {
        phaseRef.current = "speaking"; // dev (StrictMode) me effect do baar chalta hai — cleanup ka "gone" hatao
        askQuestion();
        return () => {
            phaseRef.current = "gone"; // unmount — chal rahe async kaam ab state na chhooye
            cancelSpeech();
        };
        // sirf mount par ek baar (har question naya component hai)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const repeatQuestion = async () => {
        if (phaseRef.current !== "answering") return;
        timer.stop();
        changePhase("speaking");
        await mic.stop();
        askQuestion();
    };

    const submit = async (overrideText) => {
        // speaking (skip), answering (normal / timer), error (retry) — submitting me dobara nahi
        if (!["speaking", "answering", "error"].includes(phaseRef.current)) return;
        const previousPhase = phaseRef.current;
        changePhase("submitting");
        cancelSpeech();
        // retry me pehla naapa hua time hi bhejo; AI bol hi raha tha (skip) to timer chala hi nahi → 0
        if (previousPhase === "answering") {
            timeTakenRef.current = Math.min(timer.elapsedSec(), question.timeLimitSec);
            timer.stop();
        } else if (previousPhase === "speaking") {
            timeTakenRef.current = 0;
        }
        await mic.stop(); // aakhri bola hua tukda bhi answer me aa jaaye
        if (overrideText !== undefined) setAnswer(overrideText);

        setError("");
        try {
            const res = await submitAnswer(interviewId, {
                questionIndex: index,
                answer: answerRef.current.trim(),
                timeTakenSec: timeTakenRef.current,
            });
            const { scores } = res.data;
            if (answerRef.current.trim()) toast.success(`Answer scored ${average(scores)}/10`);
            else toast("Question skipped");
            dispatch(answerEvaluated(res.data)); // currentIndex +1 → parent agla question dikhata hai
        } catch (err) {
            // pichla submit server tak pahunch gaya tha (bas jawab nahi aaya) — wahi score le lo
            if (err.response?.data?.code === "ALREADY_ANSWERED") {
                try {
                    const saved = (await getInterview(interviewId)).data.interview.questions[index];
                    if (saved.scores) {
                        dispatch(
                            answerEvaluated({ questionIndex: index, scores: saved.scores, feedback: saved.feedback }),
                        );
                        return;
                    }
                } catch {
                    /* neeche wala error dikhao */
                }
            }
            setError(getErrorMessage(err));
            changePhase("error");
        }
    };

    useEffect(() => {
        submitRef.current = submit;
    });

    const isAnswering = phase === "answering";
    const timePercent = timer.running || isAnswering ? (timer.remaining / question.timeLimitSec) * 100 : 100;
    const lowTime = isAnswering && timer.remaining <= 10;

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-sm text-gray-500">
                        Question {index + 1} of {total}
                    </span>
                    <span
                        className={`text-xs px-2.5 py-1 rounded-full capitalize ${DIFFICULTY_STYLE[question.difficulty]}`}
                    >
                        {question.difficulty}
                    </span>
                </div>
                <p className="text-lg sm:text-xl font-medium leading-relaxed">{question.question}</p>
                <button
                    type="button"
                    onClick={repeatQuestion}
                    disabled={!isAnswering}
                    className="mt-3 text-sm text-gray-500 hover:text-black flex items-center gap-1.5 disabled:opacity-40"
                >
                    <BsArrowRepeat /> Repeat question
                </button>
            </div>

            {/* timer */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">
                        {phase === "speaking" ? "Listen to the question…" : "Time left"}
                    </span>
                    <span className={`font-mono font-semibold ${lowTime ? "text-red-600" : ""}`}>
                        {isAnswering
                            ? `${Math.floor(timer.remaining / 60)}:${String(timer.remaining % 60).padStart(2, "0")}`
                            : `${question.timeLimitSec}s`}
                    </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${lowTime ? "bg-red-500" : "bg-green-500"}`}
                        style={{ width: `${timePercent}%` }}
                    />
                </div>
            </div>

            {/* answer */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <label htmlFor="answer" className="text-sm font-medium">
                        Your answer{" "}
                        {mic.supported && <span className="text-gray-400 font-normal">(speak, or edit the text)</span>}
                    </label>
                    {mic.supported && (
                        <button
                            type="button"
                            onClick={() => (mic.listening ? mic.stop() : mic.start())}
                            disabled={!isAnswering}
                            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors disabled:opacity-40 ${
                                mic.listening
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            {mic.listening ? (
                                <>
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> <BsMic />{" "}
                                    Listening
                                </>
                            ) : (
                                <>
                                    <BsMicMute /> Mic off
                                </>
                            )}
                        </button>
                    )}
                </div>

                <textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={!isAnswering}
                    rows={6}
                    maxLength={5000}
                    placeholder={
                        phase === "speaking"
                            ? "The interviewer is asking the question…"
                            : mic.supported
                              ? "Start speaking — your words appear here."
                              : "Type your answer here."
                    }
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-black resize-y disabled:bg-gray-50"
                />
                {mic.interim && <p className="text-sm text-gray-400 italic mt-1">{mic.interim}</p>}
                {!mic.supported && (
                    <p className="text-xs text-gray-500 mt-2">
                        Voice input is not supported in this browser — please type. (Chrome or Edge support voice.)
                    </p>
                )}
                {mic.error && <p className="text-xs text-amber-700 mt-2">{mic.error}</p>}
                {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mt-3">
                        {error} Your answer is kept — press Submit to try again.
                    </p>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
                    <button
                        type="button"
                        onClick={() => submit("")}
                        disabled={phase === "submitting"}
                        className="sm:w-32 border border-gray-300 py-2.5 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-40"
                    >
                        Skip
                    </button>
                    <button
                        type="button"
                        onClick={() => submit()}
                        disabled={!(isAnswering || phase === "error")}
                        className="flex-1 bg-black text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {phase === "submitting" ? (
                            <>
                                <span className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                                Evaluating your answer…
                            </>
                        ) : index === total - 1 ? (
                            "Submit & finish"
                        ) : (
                            "Submit answer"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuestionRound;

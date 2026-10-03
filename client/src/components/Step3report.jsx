// completed interview ki report — /report/:id page isse dikhata hai
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { BsCheckCircle, BsExclamationCircle, BsLightbulb, BsChevronDown } from "react-icons/bs";
import { CRITERIA } from "../constants/interview.js";

const MODE_LABEL = { hr: "HR", technical: "Technical", confidence: "Confidence" };

// score ke hisaab se rang — ek hi jagah taaki ring, bars, badges sab match karein
const scoreColor = (outOf10) => (outOf10 >= 7 ? "#16a34a" : outOf10 >= 4 ? "#d97706" : "#dc2626");

function ScoreRing({ score }) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    return (
        <div className="relative w-36 h-36">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <motion.circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={scoreColor(score / 10)}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{score}</span>
                <span className="text-xs text-gray-500">out of 100</span>
            </div>
        </div>
    );
}

function InsightList({ title, items, icon, color }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className={`font-semibold flex items-center gap-2 mb-3 ${color}`}>
                {icon} {title}
            </h3>
            <ul className="space-y-2">
                {items.map((item) => (
                    <li key={item} className="text-sm text-gray-700 leading-relaxed flex gap-2">
                        <span className="text-gray-300">•</span>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function QuestionItem({ item, index }) {
    const [open, setOpen] = useState(false);
    const avg = item.scores ? Object.values(item.scores).reduce((a, b) => a + b, 0) / 4 : 0;
    return (
        <div className="bg-white rounded-2xl border border-gray-200">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="w-full flex items-center gap-3 p-4 text-left"
            >
                <span
                    className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                    style={{ backgroundColor: scoreColor(avg) }}
                >
                    {avg.toFixed(1)}
                </span>
                <span className="flex-1 text-sm font-medium">
                    Q{index + 1}. {item.question}
                </span>
                <BsChevronDown className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="px-4 pb-4 space-y-3 text-sm border-t border-gray-100 pt-3">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Your answer</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{item.answer || <em>No answer</em>}</p>
                    </div>
                    {item.scores && (
                        <div className="flex flex-wrap gap-2">
                            {CRITERIA.map(({ key, label }) => (
                                <span key={key} className="text-xs bg-gray-100 rounded-full px-2.5 py-1">
                                    {label}: {item.scores[key]}/10
                                </span>
                            ))}
                        </div>
                    )}
                    {item.feedback && (
                        <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Feedback</p>
                            <p className="text-gray-700">{item.feedback}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Step3report({ interview }) {
    const navigate = useNavigate();
    const { report } = interview;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
            {/* summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8"
            >
                <ScoreRing score={report.overallScore} />
                <div className="flex-1 w-full">
                    <p className="text-sm text-gray-500">
                        {MODE_LABEL[interview.mode]} interview · {interview.experience} ·{" "}
                        {new Date(interview.completedAt || interview.createdAt).toLocaleDateString()}
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-semibold mt-1 mb-5">{interview.role}</h1>
                    <div className="space-y-3">
                        {CRITERIA.map(({ key, label }) => (
                            <div key={key}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{label}</span>
                                    <span className="font-medium">{report.averages[key]}/10</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: scoreColor(report.averages[key]) }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${report.averages[key] * 10}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* AI insights */}
            <div className="grid md:grid-cols-3 gap-4">
                <InsightList
                    title="Strengths"
                    items={report.strengths}
                    icon={<BsCheckCircle />}
                    color="text-green-600"
                />
                <InsightList
                    title="Weaknesses"
                    items={report.weaknesses}
                    icon={<BsExclamationCircle />}
                    color="text-red-600"
                />
                <InsightList
                    title="How to improve"
                    items={report.improvements}
                    icon={<BsLightbulb />}
                    color="text-amber-600"
                />
            </div>

            {/* per question */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Question by question</h2>
                <div className="space-y-3">
                    {interview.questions.map((item, index) => (
                        <QuestionItem key={index} item={item} index={index} />
                    ))}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                    type="button"
                    onClick={() => navigate("/interview")}
                    className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800"
                >
                    New interview
                </button>
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="border border-gray-300 px-6 py-3 rounded-xl hover:bg-gray-100"
                >
                    Back to home
                </button>
            </div>
        </div>
    );
}

export default Step3report;

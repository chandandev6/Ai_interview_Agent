import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { BsCoin, BsFileEarmarkPdf, BsX } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi";
import { startInterview, uploadResume } from "../api/interview.api.js";
import { interviewStarted } from "../redux/interviewSlice.js";
import { setCredit } from "../redux/userSlice.js";
import { saveActiveInterview } from "../utils/activeInterview.js";
import getErrorMessage from "../utils/getErrorMessage.js";
import { AVATARS, EXPERIENCE_LEVELS, INTERVIEW_COST, MODES, ROLE_SUGGESTIONS } from "../constants/interview.js";

const MAX_RESUME_MB = 5; // server (multer) ki limit — yaha pehle hi rok do, 5 MB upload karke error kyun

const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black bg-white";

function Chip({ children }) {
    return (
        <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
            {children}
        </span>
    );
}

function Step1setup() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const credit = useSelector((state) => state.user.userData?.credit ?? 0);

    const [role, setRole] = useState("");
    const [experience, setExperience] = useState(EXPERIENCE_LEVELS[0]);
    const [mode, setMode] = useState("technical");
    const [avatar, setAvatar] = useState("female");

    const [resume, setResume] = useState(null); // server ka parsed resume { skills, projects, experienceSummary }
    const [resumeName, setResumeName] = useState("");
    const [resumeLoading, setResumeLoading] = useState(false);
    const [resumeError, setResumeError] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const [starting, setStarting] = useState(false);
    const [error, setError] = useState("");
    // ek "Start" attempt ka UUID. Network fail (server ka jawab hi nahi) par wahi id dobara — server double charge nahi karega
    const requestIdRef = useRef(null);

    const notEnoughCredits = credit < INTERVIEW_COST;

    const handleResumeFile = async (file) => {
        if (!file) return;
        setResumeError("");
        if (file.type !== "application/pdf") return setResumeError("Please choose a PDF file.");
        if (file.size > MAX_RESUME_MB * 1024 * 1024) return setResumeError(`PDF must be under ${MAX_RESUME_MB} MB.`);

        setResumeLoading(true);
        setResumeName(file.name);
        try {
            const res = await uploadResume(file);
            setResume(res.data.resume);
        } catch (err) {
            setResume(null);
            setResumeName("");
            setResumeError(getErrorMessage(err));
        } finally {
            setResumeLoading(false);
        }
    };

    const removeResume = () => {
        setResume(null);
        setResumeName("");
        setResumeError("");
    };

    const handleStart = async (e) => {
        e.preventDefault();
        setError("");
        if (role.trim().length < 2) return setError("Please enter the role you are preparing for.");

        requestIdRef.current ??= crypto.randomUUID();
        setStarting(true);
        try {
            const res = await startInterview({
                role: role.trim(),
                experience,
                mode,
                resume: resume || undefined,
                requestId: requestIdRef.current,
            });
            requestIdRef.current = null;
            dispatch(setCredit(res.data.credit)); // Navbar ka credit turant update
            saveActiveInterview({ interviewId: res.data.interviewId, avatar });
            dispatch(interviewStarted({ ...res.data, avatar }));
        } catch (err) {
            // server ne jawab diya (400/402/503) = usne sab wapas kar diya → agli baar naya id.
            // INTERVIEW_STARTING = pehli request abhi chal rahi hai → wahi id rakho
            if (err.response && err.response.data?.code !== "INTERVIEW_STARTING") requestIdRef.current = null;
            setError(getErrorMessage(err));
        } finally {
            setStarting(false);
        }
    };

    return (
        <motion.form
            onSubmit={handleStart}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
        >
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm mb-4">
                    <HiSparkles /> 5 questions · voice answers · instant feedback
                </div>
                <h1 className="text-3xl sm:text-4xl font-semibold">Set up your interview</h1>
                <p className="text-gray-500 mt-2">Tell us what you are preparing for. The AI tailors every question.</p>
            </div>

            <div className="space-y-6">
                {/* role + experience */}
                <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 grid sm:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="text-sm font-medium">Role</span>
                        <input
                            list="role-suggestions"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            maxLength={80}
                            placeholder="e.g. Frontend Developer"
                            className={`${inputClass} mt-1.5`}
                        />
                        <datalist id="role-suggestions">
                            {ROLE_SUGGESTIONS.map((item) => (
                                <option key={item} value={item} />
                            ))}
                        </datalist>
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium">Experience</span>
                        <select
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            className={`${inputClass} mt-1.5`}
                        >
                            {EXPERIENCE_LEVELS.map((level) => (
                                <option key={level}>{level}</option>
                            ))}
                        </select>
                    </label>
                </section>

                {/* mode cards */}
                <section>
                    <h2 className="text-sm font-medium mb-3">Interview mode</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {MODES.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setMode(item.key)}
                                aria-pressed={mode === item.key}
                                className={`text-left bg-white rounded-2xl border-2 p-4 transition-all ${
                                    mode === item.key
                                        ? "border-green-500 shadow-md"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <img src={item.image} alt="" className="w-16 h-16 object-contain mb-3" />
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-semibold">{item.title}</h3>
                                    <span className="text-xs flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                                        {INTERVIEW_COST} <BsCoin />
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* resume (optional) */}
                <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                    <h2 className="text-sm font-medium">
                        Resume{" "}
                        <span className="text-gray-400 font-normal">(optional — questions about your projects)</span>
                    </h2>

                    {resume ? (
                        <div className="mt-3">
                            <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2">
                                <span className="flex items-center gap-2 text-sm truncate">
                                    <BsFileEarmarkPdf className="text-red-500 shrink-0" /> {resumeName}
                                </span>
                                <button
                                    type="button"
                                    onClick={removeResume}
                                    className="text-gray-500 hover:text-black"
                                    aria-label="Remove resume"
                                >
                                    <BsX size={20} />
                                </button>
                            </div>
                            {resume.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {resume.skills.map((skill) => (
                                        <Chip key={skill}>{skill}</Chip>
                                    ))}
                                </div>
                            )}
                            {resume.projects.length > 0 && (
                                <p className="text-xs text-gray-500 mt-3">
                                    Projects: {resume.projects.map((project) => project.name).join(" · ")}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => !resumeLoading && fileInputRef.current?.click()}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
                            onDragOver={(e) => {
                                e.preventDefault(); // bina iske browser PDF ko khol deta hai
                                setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(false);
                                if (!resumeLoading) handleResumeFile(e.dataTransfer.files[0]);
                            }}
                            className={`mt-3 border-2 border-dashed rounded-xl p-6 text-center text-sm cursor-pointer transition-colors ${
                                dragOver ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
                            }`}
                        >
                            {resumeLoading ? (
                                <span className="flex items-center justify-center gap-2 text-gray-600">
                                    <span className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                                    Reading your resume… (up to 30 s)
                                </span>
                            ) : (
                                <>
                                    <BsFileEarmarkPdf size={24} className="mx-auto text-gray-400 mb-2" />
                                    <span className="text-gray-600">Drop your PDF here or click to choose</span>
                                    <span className="block text-xs text-gray-400 mt-1">
                                        Text-based PDF, max {MAX_RESUME_MB} MB
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                            handleResumeFile(e.target.files[0]);
                            e.target.value = ""; // same file dobara choose ho sake
                        }}
                    />
                    {resumeError && <p className="text-sm text-red-600 mt-2">{resumeError}</p>}
                </section>

                {/* avatar */}
                <section>
                    <h2 className="text-sm font-medium mb-3">Your interviewer</h2>
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                        {AVATARS.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setAvatar(item.key)}
                                aria-pressed={avatar === item.key}
                                className={`bg-white rounded-2xl border-2 p-2 transition-all ${
                                    avatar === item.key
                                        ? "border-green-500 shadow-md"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                {/* #t=0.5 = us second ka frame preview me dikhao (bina iske khaali dabba); poori video download nahi */}
                                <video
                                    src={`${item.video}#t=0.5`}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    className="w-full aspect-square object-cover rounded-xl bg-gray-100"
                                />
                                <span className="block text-xs mt-2">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* start */}
                <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                    {notEnoughCredits && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                            You have {credit} credits. An interview needs {INTERVIEW_COST}.
                            <button
                                type="button"
                                onClick={() => navigate("/pricing")}
                                className="underline font-medium"
                            >
                                Buy credits
                            </button>
                        </div>
                    )}
                    {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

                    <button
                        type="submit"
                        disabled={starting || resumeLoading || notEnoughCredits}
                        className="w-full bg-black text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        {starting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                                Preparing your questions… (up to 30 s)
                            </>
                        ) : (
                            <>
                                Start Interview · {INTERVIEW_COST} <BsCoin />
                            </>
                        )}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-2">
                        Works best in Chrome or Edge (voice answers). In other browsers you can type.
                    </p>
                </section>
            </div>
        </motion.form>
    );
}

export default Step1setup;

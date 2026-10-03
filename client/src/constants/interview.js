// server ke interview.modes.js jaisa hi — wahan kuch badle (cost, levels) to yaha bhi badalna
import hrImg from "../assets/HR.webp";
import techImg from "../assets/tech.webp";
import confidenceImg from "../assets/confi.webp";
import maleVideo from "../assets/Videos/male-ai.mp4";
import femaleVideo from "../assets/Videos/female-ai.mp4";

export const INTERVIEW_COST = 50;

// server sirf yahi values maanta hai (zod enum) — free text nahi
export const EXPERIENCE_LEVELS = ["Fresher", "0-1 years", "1-3 years", "3-5 years", "5+ years"];

export const ROLE_SUGGESTIONS = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "MERN Stack Developer",
    "Java Developer",
    "Python Developer",
    "Data Analyst",
    "Data Scientist",
    "DevOps Engineer",
    "Android Developer",
    "UI/UX Designer",
    "Product Manager",
];

export const MODES = [
    {
        key: "technical",
        title: "Technical",
        desc: "Role-specific concepts, trade-offs and problem solving.",
        image: techImg,
    },
    { key: "hr", title: "HR", desc: "Behavioural questions — teamwork, conflict, goals.", image: hrImg },
    {
        key: "confidence",
        title: "Confidence",
        desc: "Introduce yourself, your projects, why hire you.",
        image: confidenceImg,
    },
];

export const AVATARS = [
    { key: "female", label: "Female interviewer", video: femaleVideo },
    { key: "male", label: "Male interviewer", video: maleVideo },
];

export const CRITERIA = [
    { key: "communication", label: "Communication" },
    { key: "content", label: "Content" },
    { key: "technical", label: "Technical" },
    { key: "confidence", label: "Confidence" },
];

// "technical" → "Technical" (report, history, PDF sab jagah same naam)
export const MODE_LABEL = Object.fromEntries(MODES.map((mode) => [mode.key, mode.title]));

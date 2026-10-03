import mongoose from "mongoose";
import { CRITERIA, DIFFICULTIES, INTERVIEW_STATUS, MODE_KEYS } from "./interview.modes.js";

// { communication, content, technical, confidence } — har ek 0-10
const scoresSchema = new mongoose.Schema(
    Object.fromEntries(CRITERIA.map((key) => [key, { type: Number, min: 0, max: 10 }])),
    { _id: false }, // sub-object hai, apna _id nahi chahiye
);

const questionSchema = new mongoose.Schema(
    {
        question: { type: String, required: true },
        difficulty: { type: String, enum: DIFFICULTIES, required: true },
        timeLimitSec: { type: Number, required: true },
        // null = abhi jawab nahi diya (isi se "dobara answer" 409 pakdenge)
        answer: { type: String, default: null },
        timeTakenSec: { type: Number },
        answeredAt: { type: Date },
        scores: { type: scoresSchema, default: undefined },
        feedback: { type: String },
    },
    { _id: false }, // question ko index (0-4) se pehchante hai
);

// resume ka AI-summary (Step 6) — poora PDF/text save nahi karte (privacy + chhota document)
const resumeSchema = new mongoose.Schema(
    {
        skills: [String],
        projects: [{ _id: false, name: String, tech: [String], summary: String }],
        experienceSummary: String,
    },
    { _id: false },
);

const reportSchema = new mongoose.Schema(
    {
        overallScore: { type: Number, min: 0, max: 100 }, // code calculate karta hai (weights se), AI nahi
        averages: { type: scoresSchema },
        strengths: [String],
        weaknesses: [String],
        improvements: [String],
    },
    { _id: false },
);

// ek interview = ek document (questions + answers + report sab andar) — report ek hi read me aa jaata hai
const interviewSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        // frontend har "Start" attempt ka ek random UUID bhejta hai — double-click par dono request me same aata hai
        requestId: { type: String, required: true },
        role: { type: String, required: true, trim: true },
        experience: { type: String, required: true },
        mode: { type: String, enum: MODE_KEYS, required: true },
        resume: { type: resumeSchema, default: undefined }, // optional
        status: { type: String, enum: INTERVIEW_STATUS, default: "starting" },
        questions: [questionSchema],
        report: { type: reportSchema, default: undefined }, // finish ke baad bharta hai
        creditsUsed: { type: Number, required: true },
        completedAt: { type: Date },
    },
    { timestamps: true },
);

// "meri history, newest first" — userId se filter + createdAt se sort, dono index se (lakhon interviews me bhi fast)
interviewSchema.index({ userId: 1, createdAt: -1 });

// idempotency: ek user + ek requestId = sirf ek interview. Do request ek saath aaye to MongoDB khud
// doosri ko E11000 (duplicate key) dega — isi se double-click par credit do baar nahi katta
interviewSchema.index({ userId: 1, requestId: 1 }, { unique: true });

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;

import { PDFParse } from "pdf-parse";
import AppError from "../../utils/AppError.js";
import { askAiJson } from "../../lib/ai/openRouter.js";
import User from "../user/user.model.js";
import Interview from "./interview.model.js";
import { MODES, QUESTION_PLAN, TIME_LIMITS } from "./interview.modes.js";
import { questionsPrompt, resumePrompt } from "./interview.prompts.js";
import { questionsAiSchema, resumeAiSchema } from "./interview.ai-schemas.js";

const RESUME_MAX_PAGES = 5; // resume 1-2 page ka hota hai — 300 page ka PDF server ko busy na kare
const RESUME_MAX_CHARS = 12000; // AI ko itna hi bhejo — zyada text = zyada tokens = zyada paisa/time
const RESUME_MIN_CHARS = 50; // isse kam text = scanned photo wala PDF (text nahi, sirf image)

// PDF buffer (RAM me) → saaf text. mimetype client ka label hai, asli check yahi hai: padh paaye to hi PDF
const extractPdfText = async (buffer) => {
    const parser = new PDFParse({ data: buffer });
    try {
        const { text } = await parser.getText({ first: RESUME_MAX_PAGES });
        return text
            .replace(/[ \t]+/g, " ")
            .replace(/\n\s*\n+/g, "\n")
            .trim();
    } catch {
        throw new AppError(400, "Could not read this PDF. Please upload a valid PDF file.", "INVALID_PDF");
    } finally {
        await parser.destroy(); // pdf.js ki memory free karo
    }
};

// resume PDF → { skills, projects, experienceSummary }. PDF/text kahin save nahi hota
export const parseResume = async (buffer) => {
    const text = await extractPdfText(buffer);
    if (text.length < RESUME_MIN_CHARS) {
        throw new AppError(
            400,
            "No text found in this PDF. If it is a scanned image, please upload a text-based PDF.",
            "RESUME_NO_TEXT",
        );
    }

    try {
        return await askAiJson(resumePrompt(text.slice(0, RESUME_MAX_CHARS)), resumeAiSchema);
    } catch (error) {
        console.error("Resume parse AI failed:", error.message);
        throw new AppError(503, "AI is busy right now, please try again in a minute.", "AI_UNAVAILABLE");
    }
};

// client ko sirf itna — answers/scores abhi khaali hai, userId/requestId uske kaam ke nahi
const toStartResult = (interview, credit) => ({
    interviewId: interview._id,
    mode: interview.mode,
    questions: interview.questions.map(({ question, difficulty, timeLimitSec }) => ({
        question,
        difficulty,
        timeLimitSec,
    })),
    credit,
});

// same requestId pehle aa chuka (double-click / retry) — dobara charge nahi, pehle wala hi lauta do
const resolveDuplicateStart = async (userId, requestId) => {
    const existing = await Interview.findOne({ userId, requestId });
    // pehli request abhi AI ka wait kar rahi hai (ya fail hokar hat gayi) — client thoda ruk ke dekhe
    if (!existing || existing.status === "starting") {
        throw new AppError(409, "Your interview is already being prepared. Please wait.", "INTERVIEW_STARTING");
    }
    const user = await User.findById(userId).select("credit");
    return toStartResult(existing, user?.credit);
};

// order hi asli trick hai: 1) reserve (unique index)  2) credit kaato  3) AI questions  4) save
// double-click ki doosri request step 1 par hi ruk jaati hai — credit tak pahunchti hi nahi
export const startInterview = async (userId, { role, experience, mode, resume, requestId }) => {
    const cost = MODES[mode].cost;

    // 1. reserve — do request ek saath aaye to MongoDB sirf ek ko insert karne deta hai
    let interview;
    try {
        interview = await Interview.create({ userId, requestId, role, experience, mode, resume, creditsUsed: cost });
    } catch (error) {
        if (error.code === 11000) return resolveDuplicateStart(userId, requestId);
        throw error;
    }

    // 2. credit kaato — check ($gte) + minus ($inc) ek hi atomic query me, credit kabhi negative nahi hoga
    const user = await User.findOneAndUpdate(
        { _id: userId, credit: { $gte: cost } },
        { $inc: { credit: -cost } },
        { returnDocument: "after" },
    );
    if (!user) {
        await Interview.deleteOne({ _id: interview._id });
        throw new AppError(402, `Not enough credits. This interview needs ${cost} credits.`, "NOT_ENOUGH_CREDITS");
    }

    // 3 + 4. credit kat chuka — ab kuch bhi fail ho (AI ya DB), paise wapas + reserve hatao
    try {
        let aiQuestions;
        try {
            ({ questions: aiQuestions } = await askAiJson(
                questionsPrompt({ role, experience, mode, resume }),
                questionsAiSchema,
            ));
        } catch (error) {
            console.error("Questions AI failed:", error.message);
            throw new AppError(503, "AI is busy right now, please try again in a minute.", "AI_UNAVAILABLE");
        }

        // difficulty + time CODE lagata hai (QUESTION_PLAN), AI sirf question ka text deta hai
        interview.questions = aiQuestions.map(({ question }, i) => ({
            question,
            difficulty: QUESTION_PLAN[i],
            timeLimitSec: TIME_LIMITS[QUESTION_PLAN[i]],
        }));
        interview.status = "in_progress";
        await interview.save();
    } catch (error) {
        await User.updateOne({ _id: userId }, { $inc: { credit: cost } });
        // delete = same requestId se "Try again" phir se kaam karega
        await Interview.deleteOne({ _id: interview._id });
        throw error;
    }

    return toStartResult(interview, user.credit);
};

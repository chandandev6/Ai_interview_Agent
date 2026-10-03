import { PDFParse } from "pdf-parse";
import AppError from "../../utils/AppError.js";
import { askAiJson } from "../../lib/ai/openRouter.js";
import User from "../user/user.model.js";
import Interview from "./interview.model.js";
import { CRITERIA, MODES, QUESTION_PLAN, TIME_LIMITS } from "./interview.modes.js";
import { evaluationPrompt, questionsPrompt, resumePrompt } from "./interview.prompts.js";
import { evaluationAiSchema, questionsAiSchema, resumeAiSchema } from "./interview.ai-schemas.js";

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

// claim fail hua — kyun? ek chhota read karke sahi error do
const explainAnswerConflict = async (userId, interviewId, questionIndex) => {
    const interview = await Interview.findOne({ _id: interviewId, userId }).select("status questions.answer");
    // kisi aur ka interview bhi "not found" — 403 bolte to pata chal jaata ki ye id exist karti hai
    if (!interview) throw new AppError(404, "Interview not found.", "INTERVIEW_NOT_FOUND");
    if (interview.status !== "in_progress") {
        throw new AppError(409, "This interview is not in progress.", "INTERVIEW_NOT_ACTIVE");
    }
    if (!interview.questions[questionIndex])
        throw new AppError(400, "This question does not exist.", "INVALID_QUESTION");
    throw new AppError(409, "This question is already answered.", "ALREADY_ANSWERED");
};

// order: 1) answer claim (atomic)  2) AI evaluate  3) scores save. AI fail → claim wapas (retry ho sake)
// claim pehle isliye — double-click ki doosri request step 1 par 409 kha jaati hai, AI tak nahi pahunchti
export const submitAnswer = async (userId, interviewId, { questionIndex, answer, timeTakenSec }) => {
    const path = `questions.${questionIndex}`;
    const cleanAnswer = answer.trim();

    // 1. claim — shart + update ek hi query me. MongoDB ek document par ek update ek time me karta hai,
    // isliye do request ek saath aaye to bhi sirf ek ko "answer: null" milega
    const interview = await Interview.findOneAndUpdate(
        {
            _id: interviewId,
            userId, // owner check yahi ho gaya
            status: "in_progress",
            [`${path}.question`]: { $exists: true }, // bina iske "questions.7.answer: null" bhi match ho jaata (missing = null)
            // "answer: null" NAHI chalta — array par "questions.3" ko MongoDB index 3 bhi padhta hai AUR har element
            // ka "3" naam ka field bhi (jo missing = null) → hamesha match. "koi string nahi" wala check safe hai
            [`${path}.answer`]: { $not: { $type: "string" } },
        },
        { $set: { [`${path}.answer`]: cleanAnswer, [`${path}.answeredAt`]: new Date() } },
        { returnDocument: "after" },
    );
    if (!interview) return explainAnswerConflict(userId, interviewId, questionIndex);

    const question = interview.questions[questionIndex];
    // client ka time trust nahi — limit se zyada nahi maanenge
    const timeTaken = Math.min(Math.round(timeTakenSec), question.timeLimitSec);

    // 2. khaali / skip kiya answer → seedha 0, AI ka paisa + time bachao
    let evaluation;
    if (!cleanAnswer) {
        evaluation = {
            scores: Object.fromEntries(CRITERIA.map((key) => [key, 0])),
            feedback: "No answer was given. Even a short attempt is better than skipping — try to say what you know.",
        };
    } else {
        try {
            evaluation = await askAiJson(
                evaluationPrompt({
                    mode: interview.mode,
                    role: interview.role,
                    experience: interview.experience,
                    question: question.question,
                    difficulty: question.difficulty,
                    answer: cleanAnswer,
                    timeLimitSec: question.timeLimitSec,
                    timeTakenSec: timeTaken,
                }),
                evaluationAiSchema,
            );
        } catch (error) {
            console.error("Evaluation AI failed:", error.message);
            // claim wapas — warna question "answered" ban ke atak jaata, bina score ke
            await Interview.updateOne(
                { _id: interviewId, [`${path}.answer`]: cleanAnswer },
                { $set: { [`${path}.answer`]: null }, $unset: { [`${path}.answeredAt`]: "" } },
            );
            throw new AppError(503, "AI is busy right now, please submit your answer again.", "AI_UNAVAILABLE");
        }
    }

    // 3. scores save — sirf is question ke fields, baaki document ko nahi chhoote
    await Interview.updateOne(
        { _id: interviewId },
        {
            $set: {
                [`${path}.scores`]: evaluation.scores,
                [`${path}.feedback`]: evaluation.feedback,
                [`${path}.timeTakenSec`]: timeTaken,
            },
        },
    );

    return { questionIndex, ...evaluation };
};

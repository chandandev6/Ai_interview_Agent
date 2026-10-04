import mongoose from "mongoose";
import { UnrecoverableError } from "bullmq";
import { PDFParse } from "pdf-parse";
import AppError from "../../utils/AppError.js";
import { askAiJson } from "../../lib/ai/openRouter.js";
import User from "../user/user.model.js";
import { addCredits, chargeCredits, refundInterviewIfCharged } from "../credit/credit.service.js";
import Interview from "./interview.model.js";
import { getLogger } from "../../lib/logger.js";
import { cached, cacheKeys, clearCache } from "../../lib/cache.js";
import { enqueueAiJob } from "../../lib/queue/aiJobs.js";
import { JOB } from "../../lib/queue/queues.js";
import { CRITERIA, MODES, QUESTION_PLAN, TIME_LIMITS } from "./interview.modes.js";
import { evaluationPrompt, questionsPrompt, reportPrompt, resumePrompt } from "./interview.prompts.js";
import { evaluationAiSchema, questionsAiSchema, reportAiSchema, resumeAiSchema } from "./interview.ai-schemas.js";

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

// API (fast): PDF → text yahi (ms lagta hai, aur galat PDF par user ko turant 400). Sirf slow AI kaam queue me.
// 5MB PDF Redis me nahi bhejte — sirf text (max 12k chars). PDF/text kahin save nahi hota
export const requestResumeParse = async (userId, buffer) => {
    const text = await extractPdfText(buffer);
    if (text.length < RESUME_MIN_CHARS) {
        throw new AppError(
            400,
            "No text found in this PDF. If it is a scanned image, please upload a text-based PDF.",
            "RESUME_NO_TEXT",
        );
    }
    const jobId = await enqueueAiJob(JOB.PARSE_RESUME, userId, { text: text.slice(0, RESUME_MAX_CHARS) });
    return { jobId };
};

// WORKER: text → { skills, projects, experienceSummary }. retries: 0 — retry ab BullMQ karta hai (backoff ke saath)
export const parseResumeText = async (text) => {
    try {
        return await askAiJson(resumePrompt(text), resumeAiSchema, { retries: 0 });
    } catch (error) {
        getLogger().warn({ err: error }, "Resume parse AI failed");
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

    // 2. credit kaato — check ($gte) + minus ($inc) ek hi atomic query me, credit kabhi negative nahi hoga.
    // Saath me ledger row (credit.service) — dono ek MongoDB transaction me
    const user = await chargeCredits(userId, cost, { interviewId: interview._id });
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
            getLogger().error({ err: error }, "Questions AI failed");
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
        await addCredits(userId, cost, {
            type: "refund",
            interviewId: interview._id,
            note: "Interview could not start",
        });
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
            getLogger().error({ err: error }, "Evaluation AI failed");
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

// client ko poora interview dikhate waqt ye internal fields nahi bhejte
const INTERVIEW_VIEW = "-userId -requestId -__v";

// numbers CODE nikalta hai, AI nahi — AI maths me kachcha hai aur har baar alag number de sakta hai
// bina jawab wala question = 0 (beech me chhod ke jaane se score badhna nahi chahiye)
const calculateScores = (questions, weights) => {
    const averages = Object.fromEntries(
        CRITERIA.map((key) => {
            const total = questions.reduce((sum, q) => sum + (q.scores?.[key] ?? 0), 0);
            return [key, Math.round((total / questions.length) * 10) / 10]; // 1 decimal: 6.4
        }),
    );
    // weighted average (0-10) → 0-100. Har mode ke weights alag (technical me "technical" sabse bhaari)
    const overallScore = Math.round(CRITERIA.reduce((sum, key) => sum + averages[key] * weights[key], 0) * 10);
    return { averages, overallScore };
};

// finish ka claim fail hua — kyun?
const resolveFinishConflict = async (userId, interviewId) => {
    const interview = await Interview.findOne({ _id: interviewId, userId }).select(INTERVIEW_VIEW).lean();
    if (!interview) throw new AppError(404, "Interview not found.", "INTERVIEW_NOT_FOUND");
    // pehle hi complete — retry (network glitch) ko error nahi, wahi report do
    if (interview.status === "completed") return interview;
    if (interview.status === "finishing") {
        throw new AppError(409, "Your report is already being prepared. Please wait.", "INTERVIEW_FINISHING");
    }
    if (interview.status === "in_progress") {
        // in_progress hai phir bhi claim fail = koi answer abhi AI check kar raha hai
        throw new AppError(
            409,
            "Your last answer is still being evaluated. Please try again in a moment.",
            "ANSWER_BEING_EVALUATED",
        );
    }
    throw new AppError(409, "This interview is not in progress.", "INTERVIEW_NOT_ACTIVE");
};

// API (fast): 1) claim (in_progress → finishing)  2) job queue me → { jobId }. Report worker banata hai (completeFinish).
// Pehle se completed → { interview } (retry / network glitch ko wahi report)
export const requestFinish = async (userId, interviewId) => {
    // 1. claim — double "Finish" ki doosri request yahi ruk jaati hai, aur finishing ke baad Step 8 naya answer nahi leta
    const interview = await Interview.findOneAndUpdate(
        {
            _id: interviewId,
            userId,
            status: "in_progress",
            // koi answer claim hua par score nahi aaya (AI abhi check kar raha) → abhi finish nahi, warna wo 0 ginta
            questions: { $not: { $elemMatch: { answer: { $type: "string" }, scores: { $exists: false } } } },
        },
        { $set: { status: "finishing" } },
        { returnDocument: "after" },
    );
    if (!interview) return { interview: await resolveFinishConflict(userId, interviewId) };

    try {
        const jobId = await enqueueAiJob(JOB.FINISH_INTERVIEW, userId, { interviewId: String(interviewId) });
        return { jobId };
    } catch (error) {
        // queue me nahi gaya → claim wapas, user dobara "Finish" daba sake
        await Interview.updateOne({ _id: interviewId, status: "finishing" }, { $set: { status: "in_progress" } });
        throw error;
    }
};

// WORKER: 1) scores code se  2) AI text  3) save completed. Aakhri try bhi fail → wapas in_progress (user retry kare)
export const completeFinish = async (interviewId, { finalAttempt }) => {
    const interview = await Interview.findById(interviewId);
    if (!interview) throw new UnrecoverableError("Interview not found.");
    // pichhli try ne save kar diya tha, phir worker crash hua (job dobara aaya) — kaam ho chuka hai
    if (interview.status === "completed") return { interviewId };
    // UnrecoverableError = BullMQ retry nahi karega (dobara karne se bhi kuch nahi badlega)
    if (interview.status !== "finishing") {
        throw new UnrecoverableError("This interview is no longer being finished. Please click Finish again.");
    }

    try {
        // 1. numbers
        const { averages, overallScore } = calculateScores(interview.questions, MODES[interview.mode].weights);

        // 2. text — ek bhi jawab nahi diya to AI ka paisa kyun kharch karein
        let summary;
        if (!interview.questions.some((q) => q.answer)) {
            summary = {
                strengths: ["You started the interview — that is the first step."],
                weaknesses: ["No questions were answered, so we could not evaluate your skills."],
                improvements: [
                    "Try again and answer every question, even briefly — a short attempt scores better than silence.",
                ],
            };
        } else {
            try {
                summary = await askAiJson(
                    reportPrompt({
                        mode: interview.mode,
                        role: interview.role,
                        experience: interview.experience,
                        overallScore,
                        questions: interview.questions,
                    }),
                    reportAiSchema,
                    { retries: 0 },
                );
            } catch (error) {
                getLogger().warn({ err: error }, "Report AI failed");
                throw new AppError(503, "AI is busy right now, please click Finish again.", "AI_UNAVAILABLE");
            }
        }

        // 3. save — status: finishing wali shart, taaki galti se kisi aur state ko overwrite na karein
        await Interview.updateOne(
            { _id: interviewId, status: "finishing" },
            { $set: { status: "completed", completedAt: new Date(), report: { overallScore, averages, ...summary } } },
        );
        // naya completed interview = analytics badle → purane stats cache se hatao
        await clearCache(cacheKeys.stats(interview.userId));
        // job result chhota rakho (Redis me 1 ghanta rehta hai) — client report GET /:id se laata hai
        return { interviewId: String(interviewId) };
    } catch (error) {
        // beech ki try fail → BullMQ thodi der me dobara chalayega, status "finishing" hi rehne do.
        // aakhri try → claim wapas, user dobara "Finish" daba sake
        if (finalAttempt) {
            await Interview.updateOne({ _id: interviewId, status: "finishing" }, { $set: { status: "in_progress" } });
        }
        throw error;
    }
};

// WORKER (har minute): crash ke kaaran atke interviews theek karo — PRD ke 2 "known gaps"
const STUCK_STARTING_MS = 10 * 60 * 1000; // start: 3 AI try × 60s ≈ 3 min max — 10 min = pakka atka hai
const STUCK_FINISHING_MS = 15 * 60 * 1000; // finish job ke retries + queue me wait se kaafi zyada

export const cleanupStuckInterviews = async () => {
    const now = Date.now();

    // 1. "starting" me atka (server credit kaatne ke baad, refund se pehle crash hua) → paise wapas + reserve hatao.
    // Order: refund PEHLE, delete BAAD. Beech me crash → agli baar refund dobara nahi hoga (ledger check), bas delete
    const stuckStarts = await Interview.find({
        status: "starting",
        updatedAt: { $lt: new Date(now - STUCK_STARTING_MS) },
    })
        .select("_id userId creditsUsed")
        .limit(100)
        .lean();
    for (const stuck of stuckStarts) {
        await refundInterviewIfCharged({
            userId: stuck.userId,
            interviewId: stuck._id,
            amount: stuck.creditsUsed,
            note: "Interview could not start (automatic refund)",
        });
        await Interview.deleteOne({ _id: stuck._id, status: "starting" });
    }

    // 2. "finishing" me atka (worker baar baar crash, job khatam) → wapas in_progress, user Finish dobara daba sake
    const { modifiedCount: finishingReset } = await Interview.updateMany(
        { status: "finishing", updatedAt: { $lt: new Date(now - STUCK_FINISHING_MS) } },
        { $set: { status: "in_progress" } },
    );

    return { startingRefunded: stuckStarts.length, finishingReset };
};

// ek interview (report page) — sirf owner. Kisi aur ka = 404
export const getInterview = async (userId, interviewId) => {
    const interview = await Interview.findOne({ _id: interviewId, userId }).select(INTERVIEW_VIEW).lean();
    if (!interview) throw new AppError(404, "Interview not found.", "INTERVIEW_NOT_FOUND");
    return interview;
};

// list ke liye sirf halke fields — questions/resume (sabse bhaari) nahi
const HISTORY_FIELDS = "role experience mode status creditsUsed report.overallScore createdAt completedAt";

// history, newest first, page by page. Index { userId, createdAt: -1 } se filter + sort dono fast
export const getHistory = async (userId, { page, limit, mode }) => {
    // "starting" = Step 7 ka reserve, asli interview nahi
    const filter = { userId, status: { $ne: "starting" } };
    if (mode) filter.mode = mode;

    // dono query ek saath chalao (ek ke baad ek nahi) — .lean() = plain object, sirf padhna hai to tez + kam memory
    const [items, total] = await Promise.all([
        Interview.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select(HISTORY_FIELDS)
            .lean(),
        Interview.countDocuments(filter),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const TREND_POINTS = 20; // chart me aakhri itne interviews — 500 points ka chart padha bhi nahi jaata

// 1 decimal tak round (aggregation ke andar hi — client ko 6.333333 nahi bhejna)
const round1 = (expr) => ({ $round: [expr, 1] });

// analytics: summary + skill averages + mode wise + score trend — sab ek hi aggregation (ek DB round trip)
// stats sirf interview complete hone par badalte hai (tab clear karte hai) — TTL bas safety ke liye
const STATS_CACHE_TTL = 10 * 60;
export const getStats = (userId) => cached(cacheKeys.stats(userId), STATS_CACHE_TTL, () => computeStats(userId));

const computeStats = async (userId) => {
    const [result] = await Interview.aggregate([
        // aggregate() me Mongoose string → ObjectId khud nahi badalta (find() badalta hai) — khud karo, warna 0 match
        { $match: { userId: new mongoose.Types.ObjectId(userId), status: "completed" } },
        {
            // $facet = ek hi data par kai alag pipelines saath me
            $facet: {
                summary: [
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            averageScore: { $avg: "$report.overallScore" },
                            bestScore: { $max: "$report.overallScore" },
                            ...Object.fromEntries(CRITERIA.map((key) => [key, { $avg: `$report.averages.${key}` }])),
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            total: 1,
                            averageScore: round1("$averageScore"),
                            bestScore: 1,
                            skills: Object.fromEntries(CRITERIA.map((key) => [key, round1(`$${key}`)])),
                        },
                    },
                ],
                byMode: [
                    {
                        $group: {
                            _id: "$mode",
                            count: { $sum: 1 },
                            averageScore: { $avg: "$report.overallScore" },
                            bestScore: { $max: "$report.overallScore" },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            mode: "$_id",
                            count: 1,
                            averageScore: round1("$averageScore"),
                            bestScore: 1,
                        },
                    },
                    { $sort: { count: -1 } },
                ],
                // newest pehle le ke kaato, phir code me ulta (chart purane → naye chalta hai)
                trend: [
                    { $sort: { completedAt: -1 } },
                    { $limit: TREND_POINTS },
                    { $project: { _id: 1, role: 1, mode: 1, completedAt: 1, overallScore: "$report.overallScore" } },
                ],
            },
        },
    ]);

    const summary = result.summary[0] ?? { total: 0, averageScore: null, bestScore: null, skills: null };
    const trend = result.trend.reverse();
    // pichle interview se kitna badla (+/-) — "improve ho raha hoon?" ka seedha jawab
    const latest = trend.at(-1)?.overallScore ?? null;
    const previous = trend.at(-2)?.overallScore ?? null;

    return {
        summary: {
            ...summary,
            latestScore: latest,
            change: latest !== null && previous !== null ? latest - previous : null,
        },
        byMode: result.byMode,
        trend,
    };
};

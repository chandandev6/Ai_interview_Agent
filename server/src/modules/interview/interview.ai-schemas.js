// AI ke jawab ka shape — askAiJson() isse check karta hai. AI ka output user input jitna hi untrusted hai.
// Thoda lenient: zyada items aaye to kaat do (fail mat karo), kam/galat aaye to fail → retry
import { z } from "zod";
import { QUESTION_PLAN } from "./interview.modes.js";

const text = (max) => z.string().trim().min(1).max(max);

// list me extra items aaye to pehle `max` rakho
const list = (item, max) => z.array(item).transform((items) => items.slice(0, max));

// AI kabhi 7.5 ya "8" (string) bhej deta hai — number banao, 0-10 ke andar, round
const score = z.coerce
    .number()
    .min(0)
    .max(10)
    .transform((n) => Math.round(n));

// Step 6: resume se nikali info
export const resumeAiSchema = z.object({
    skills: list(text(60), 20).default([]),
    projects: list(
        z.object({
            name: text(120),
            tech: list(text(60), 10).default([]),
            summary: z.string().trim().max(400).default(""),
        }),
        5,
    ).default([]),
    experienceSummary: z.string().trim().max(600).default(""),
});

// Step 7: questions — sirf text AI ka; difficulty/time hum QUESTION_PLAN se lagate hai
export const questionsAiSchema = z.object({
    questions: list(z.object({ question: text(500) }), QUESTION_PLAN.length).refine(
        (questions) => questions.length === QUESTION_PLAN.length,
        `must contain exactly ${QUESTION_PLAN.length} questions`,
    ),
});

// Step 8: ek answer ka evaluation
export const evaluationAiSchema = z.object({
    scores: z.object({
        communication: score,
        content: score,
        technical: score,
        confidence: score,
    }),
    feedback: text(1000),
});

// Step 9: final report ke text parts (numbers code se aate hai)
export const reportAiSchema = z.object({
    strengths: list(text(300), 4).refine((items) => items.length > 0, "needs at least 1 item"),
    weaknesses: list(text(300), 4).refine((items) => items.length > 0, "needs at least 1 item"),
    improvements: list(text(300), 5).refine((items) => items.length > 0, "needs at least 1 item"),
});

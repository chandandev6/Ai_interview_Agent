// interview routes ke request ka shape — validate() middleware isse check karta hai
import { z } from "zod";
import { EXPERIENCE_LEVELS, MODE_KEYS, QUESTION_PLAN } from "./interview.modes.js";
import { resumeAiSchema } from "./interview.ai-schemas.js";

export const startInterviewSchema = z.object({
    role: z
        .string({ error: "Role is required" })
        .trim()
        .min(2, "Role must be at least 2 characters")
        .max(80, "Role must be at most 80 characters"),
    // dropdown values hi chalenge — free text prompt me nahi jaata
    experience: z.enum(EXPERIENCE_LEVELS, { error: `Experience must be one of: ${EXPERIENCE_LEVELS.join(", ")}` }),
    mode: z.enum(MODE_KEYS, { error: `Mode must be one of: ${MODE_KEYS.join(", ")}` }),
    // Step 6 ka parsed resume client wapas bhejta hai (optional) — same limits wala schema reuse
    resume: resumeAiSchema.optional(),
    // frontend ka random UUID (crypto.randomUUID()) — double-click pakadne ke liye
    requestId: z.uuid({ error: "requestId must be a UUID" }),
});

// URL ka :id — MongoDB ObjectId (24 hex chars). Galat id par DB tak jaane ki zaroorat hi nahi
export const interviewIdParamsSchema = z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid interview id"),
});

export const submitAnswerSchema = z.object({
    questionIndex: z
        .number({ error: "questionIndex must be a number" })
        .int()
        .min(0)
        .max(QUESTION_PLAN.length - 1, `questionIndex must be 0-${QUESTION_PLAN.length - 1}`),
    // khaali string allowed hai (skip / kuch nahi bola) — service use 0 score deta hai, AI call nahi
    // max = ~2 minute bolne ka text bahut hai; isse lamba = koi tokens jalana chahta hai
    answer: z.string({ error: "answer must be a string" }).max(5000, "Answer is too long").default(""),
    timeTakenSec: z.number({ error: "timeTakenSec must be a number" }).min(0).default(0),
});

// interview routes ke request ka shape — validate() middleware isse check karta hai
import { z } from "zod";
import { EXPERIENCE_LEVELS, MODE_KEYS } from "./interview.modes.js";
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

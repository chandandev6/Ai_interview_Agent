// .env ko startup par hi check karo — kuch missing/galat ho to server start hi mat hone do (fail fast)
import 'dotenv/config';
import { z } from 'zod';

// har variable ka rule: kaisa hona chahiye, aur na ho to default kya
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(8000),

    MONGODB_URL: z.string().min(1),
    MONGO_POOL_SIZE: z.coerce.number().int().positive().default(50),

    JWT_SECRET: z.string().min(16, "must be at least 16 characters"),

    CLIENT_URL: z.string().default("http://localhost:5173"),
    FIREBASE_PROJECT_ID: z.string().min(1),

    OPENROUTER_API_KEY: z.string().min(1),
    OPENROUTER_MODEL: z.string().default("anthropic/claude-haiku-4.5"),

    // email bhejne ke liye SMTP (Gmail: smtp.gmail.com + App Password) — local me optional, na ho to link terminal me print
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().optional(), // e.g. "InterviewIQ <yourmail@gmail.com>" — na ho to SMTP_USER
}).superRefine((env, ctx) => {
    // production me asli users ko email jaana hi chahiye — bina SMTP ke server start mat karo
    if (env.NODE_ENV === "production") {
        for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"]) {
            if (!env[key]) ctx.addIssue({ code: "custom", path: [key], message: "is required in production" });
        }
    }
});

// safeParse throw nahi karta — { success, data, error } deta hai, taaki hum saaf message print kar sake
const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error("❌ Invalid environment variables in server/.env:");
    for (const issue of result.error.issues) {
        console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
}

// baaki files process.env ki jagah ye use karengi — checked + sahi type (PORT number hai, string nahi)
export const env = result.data;

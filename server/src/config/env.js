// .env ko startup par hi check karo — kuch missing/galat ho to server start hi mat hone do (fail fast)
import "dotenv/config";
import { z } from "zod";

// har variable ka rule: kaisa hona chahiye, aur na ho to default kya
const envSchema = z
    .object({
        NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
        PORT: z.coerce.number().int().positive().default(8000),

        MONGODB_URL: z.string().min(1),
        MONGO_POOL_SIZE: z.coerce.number().int().positive().default(50),

        JWT_SECRET: z.string().min(16, "must be at least 16 characters"),

        CLIENT_URL: z.string().default("http://localhost:5173"),
        FIREBASE_PROJECT_ID: z.string().min(1),

        OPENROUTER_API_KEY: z.string().min(1),
        OPENROUTER_MODEL: z.string().default("anthropic/claude-haiku-4.5"),
        // comma se alag backup models — main busy/rate-limited ho to OpenRouter agla try karta hai (free models ke liye zaruri)
        OPENROUTER_FALLBACK_MODELS: z
            .string()
            .default("")
            .transform((list) =>
                list
                    .split(",")
                    .map((model) => model.trim())
                    .filter(Boolean),
            ),

        // email bhejne ke liye SMTP (Gmail: smtp.gmail.com + App Password) — local me optional, na ho to link terminal me print
        SMTP_HOST: z.string().optional(),
        SMTP_PORT: z.coerce.number().int().positive().default(587),
        SMTP_USER: z.string().optional(),
        SMTP_PASS: z.string().optional(),
        MAIL_FROM: z.string().optional(), // e.g. "InterviewIQ <yourmail@gmail.com>" — na ho to SMTP_USER

        // Razorpay (credits kharidna). Dashboard → Test Mode → API Keys. Na ho to payments band (baaki app chalta hai)
        RAZORPAY_KEY_ID: z.string().optional(),
        RAZORPAY_KEY_SECRET: z.string().optional(),
        // Dashboard → Webhooks me jo secret khud likha — webhook ka signature isse check hota hai
        RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

        // Redis (rate-limit counters + cache). Local: docker compose → redis://localhost:6380. Khaali → in-memory, no cache
        REDIS_URL: z.string().optional(),

        // kitna detail log ho: debug < info < warn < error. Production me "info" kaafi hai
        LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
        // sentry.io → Project → Client Keys (DSN). Na ho to error reporting band
        SENTRY_DSN: z.string().optional(),
    })
    .superRefine((env, ctx) => {
        // production me asli users ko email jaana hi chahiye — bina SMTP ke server start mat karo
        // aur Redis bhi — kai server copies me bina Redis ke har copy ka rate limit alag hota
        if (env.NODE_ENV === "production") {
            for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "REDIS_URL"]) {
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

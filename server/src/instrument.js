// Sentry sabse pehle load hona chahiye (node --import) — tabhi wo express/http ko andar se track kar pata hai
import * as Sentry from "@sentry/node";
import { env } from "./config/env.js";

// DSN khaali → Sentry band (local dev me zarurat nahi, baaki app normal chalta hai)
if (env.SENTRY_DSN) {
    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.NODE_ENV,
        tracesSampleRate: 0.1, // sirf 10% requests ki timing bhejo — free quota bachao
        sendDefaultPii: false, // IP/cookies Sentry ko mat bhejo
    });
}

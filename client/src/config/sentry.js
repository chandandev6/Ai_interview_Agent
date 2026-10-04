// browser ke errors Sentry dashboard par — users kabhi report nahi karte, Sentry khud batata hai
const dsn = import.meta.env.VITE_SENTRY_DSN;

// DSN khaali → kuch load hi nahi (local dev). Hai → Sentry alag chunk me baad me load, taaki pehla page slow na ho
export const initSentry = () => {
    if (!dsn) return;
    import("@sentry/react").then((Sentry) =>
        Sentry.init({
            dsn,
            environment: import.meta.env.MODE,
            sendDefaultPii: false, // IP/cookies mat bhejo
        }),
    );
};

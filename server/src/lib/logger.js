// poore server ka ek logger — console.log ki jagah. JSON lines likhta hai (level, time, msg, reqId...) → search/filter ho sake
import { AsyncLocalStorage } from "node:async_hooks";
import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
    level: env.LOG_LEVEL,
    // password/token/cookie kabhi log file me nahi jaane chahiye
    redact: ["req.headers.cookie", "req.headers.authorization", 'res.headers["set-cookie"]'],
    // dev me rangeen, padhne layak lines; production me plain JSON (fast, log tools ke liye)
    ...(env.NODE_ENV === "development" && {
        transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
    }),
});

// har request ka apna logger (reqId wala) yaha "yaad" rehta hai — poori async chain me, bina req pass kiye
const requestStore = new AsyncLocalStorage();

export const runWithRequestLogger = (log, next) => requestStore.run(log, next);

// services isse log kare: request ke andar → reqId wala logger, bahar (startup, jobs) → normal logger
export const getLogger = () => requestStore.getStore() ?? logger;

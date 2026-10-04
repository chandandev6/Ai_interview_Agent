// har request ko ek ID + ek log line (method, url, status, time) — ek request ki saari lines reqId se jud jaati hai
import { randomUUID } from "node:crypto";
import { pinoHttp } from "pino-http";
import { logger, runWithRequestLogger } from "../lib/logger.js";

const httpLogger = pinoHttp({
    logger,
    // proxy/load balancer ne ID di ho to wahi use karo (poori chain me ek ID), warna nayi banao
    genReqId: (req, res) => {
        // bahar se aayi ID sirf tab maano jab chhoti + saaf ho — koi 1MB ka header bhej ke logs na bhar de
        const incoming = req.headers["x-request-id"];
        // typeof check zaruri: .test(undefined) → "undefined" string ban ke match ho jaata hai
        const id = typeof incoming === "string" && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID();
        res.setHeader("X-Request-Id", id); // user/frontend support ko yahi ID bata sake
        return id;
    },
    // req.log par sirf { reqId } — services ki har line me ID aaye, poora req object nahi
    quietReqLogger: true,
    // /health har kuch second me hit hota hai — logs me kachra mat bharo
    autoLogging: { ignore: (req) => req.url === "/health" || req.url === "/ready" },
    // log line response ke baad banti hai, tab tak isAuth ne userId set kar diya hota hai
    customProps: (req) => (req.userId ? { userId: req.userId } : {}),
    // 4xx = user ki galti (warn), 5xx = humari (error)
    customLogLevel: (req, res, err) =>
        err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
    // poore headers nahi — sirf kaam ki cheezein (chhote logs, cookies leak nahi)
    serializers: {
        req: (req) => ({ method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
    },
});

// pino-http ke baad: req.log ko is request ki async chain me rakh do → services getLogger() se reqId wala logger paaye
export const requestLogger = (req, res, next) => httpLogger(req, res, () => runWithRequestLogger(req.log, next));

// BullMQ queues — Redis me ek "kaam ki list". API kaam daalti hai (producer), worker.js nikaal ke karta hai (consumer).
// Fayda: slow AI kaam (5-60s) HTTP request ko nahi rokta, worker crash ho to job dobara chalta hai, retry khud hota hai
import { Queue } from "bullmq";
import { redis } from "../../config/redis.js";
import { logger } from "../logger.js";

export const AI_QUEUE = "ai";
export const MAINTENANCE_QUEUE = "maintenance";

// job ke naam ek jagah — API aur worker dono yahi use kare (typo = job kabhi process nahi hoga)
export const JOB = {
    PARSE_RESUME: "parse-resume",
    FINISH_INTERVIEW: "finish-interview",
    CLEANUP_STUCK: "cleanup-stuck-interviews",
};

export const aiQueue = new Queue(AI_QUEUE, {
    connection: redis, // API ka hi Redis client — queue me daalna normal command hai (worker jaisa blocking nahi)
    defaultJobOptions: {
        // AI fail → 2s baad, phir 4s baad dobara (exponential backoff). 3 try ke baad "failed"
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        // client result poll karta hai — 1 ghanta rakho, phir Redis khud saaf. Failed 1 din (debug ke liye)
        removeOnComplete: { age: 60 * 60 },
        removeOnFail: { age: 24 * 60 * 60 },
    },
});

// har minute wala safai ka kaam (atke hue interviews) — AI jobs se alag, taaki AI ki bheed me ye na ruke
export const maintenanceQueue = new Queue(MAINTENANCE_QUEUE, {
    connection: redis,
    defaultJobOptions: { removeOnComplete: { count: 20 }, removeOnFail: { count: 50 } },
});

// listener na ho to EventEmitter "error" par process gira deta hai. Redis down ka log config/redis.js kar chuka
for (const queue of [aiQueue, maintenanceQueue]) {
    queue.on("error", (error) => logger.debug({ err: error, queue: queue.name }, "Queue error"));
}

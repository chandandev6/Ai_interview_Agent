// BullMQ workers ek jagah — worker.js (alag process) aur server.js (RUN_WORKER_IN_API=true, Render free plan) dono yahi
// use karte hai. Code wahi, bas kaha chalta hai wo badalta hai
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { isRedisReady } from "../config/redis.js";
import { logger } from "../lib/logger.js";
import { AI_QUEUE, MAINTENANCE_QUEUE, JOB, maintenanceQueue } from "../lib/queue/queues.js";
import { processAiJob, processMaintenanceJob } from "./processors.js";

// MongoDB + Redis pehle se connected hone chahiye. Return: close() — shutdown par chalte jobs poore karke band
export const startWorkers = async () => {
    // worker ko alag connection chahiye: ye Redis par "block" karke naye job ka wait karta hai, aur
    // maxRetriesPerRequest: null (BullMQ ka rule) — Redis thodi der gaya to worker girna nahi, wait karna hai
    const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

    const aiWorker = new Worker(AI_QUEUE, processAiJob, { connection, concurrency: env.WORKER_CONCURRENCY });
    // safai ek time par ek hi — do saath chale to ek hi interview ko do baar dekhte
    const maintenanceWorker = new Worker(MAINTENANCE_QUEUE, processMaintenanceJob, { connection, concurrency: 1 });

    for (const worker of [aiWorker, maintenanceWorker]) {
        // Redis down par har reconnect try ek error deta hai (10/s) — "Redis down" config/redis.js ek baar log kar chuka.
        // Sirf Redis chalte hue aaye errors dikhao
        worker.on("error", (error) => {
            if (isRedisReady()) logger.warn({ err: error, queue: worker.name }, "Worker error");
        });
    }

    // har 60s ek cleanup job. "upsert" = kitne bhi worker start ho, schedule ek hi rehta hai (duplicate nahi)
    await maintenanceQueue.upsertJobScheduler(JOB.CLEANUP_STUCK, { every: 60 * 1000 }, { name: JOB.CLEANUP_STUCK });

    logger.info(`Workers running (AI concurrency ${env.WORKER_CONCURRENCY})`);

    return async () => {
        await Promise.all([aiWorker.close(), maintenanceWorker.close()]);
        await connection.quit();
    };
};

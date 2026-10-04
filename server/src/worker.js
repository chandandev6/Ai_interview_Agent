// alag process (npm run worker) — queue se jobs nikaal ke slow AI kaam karta hai. API sirf job daalti hai.
// Fayda: API fast rehti hai, worker alag se scale (zyada copies) ho sakta hai, crash hua to job dobara chalta hai
import { Worker, UnrecoverableError } from "bullmq";
import { Redis } from "ioredis";
import { env } from "./config/env.js";
import connectDB, { disconnectDB } from "./config/db.js";
import { connectRedis, disconnectRedis, isRedisReady } from "./config/redis.js";
import { logger, getLogger, runWithRequestLogger } from "./lib/logger.js";
import AppError from "./utils/AppError.js";
import { AI_QUEUE, MAINTENANCE_QUEUE, JOB, maintenanceQueue } from "./lib/queue/queues.js";
import { releaseAiLock } from "./lib/queue/aiJobs.js";
import { cleanupStuckInterviews, completeFinish, parseResumeText } from "./modules/interview/interview.service.js";

// attemptsMade = ab tak kitni try FAIL hui. Ye wali bhi fail hui to aur try bachi?
const isFinalAttempt = (job) => job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

const aiHandlers = {
    [JOB.PARSE_RESUME]: async (job) => ({ resume: await parseResumeText(job.data.text) }),
    [JOB.FINISH_INTERVIEW]: (job) => completeFinish(job.data.interviewId, { finalAttempt: isFinalAttempt(job) }),
};

// har job ka apna logger (jobId + API wala reqId) — services ka getLogger() isi ko use karega
const processAiJob = (job) =>
    runWithRequestLogger(
        logger.child({ jobId: job.id, job: job.name, reqId: job.data.reqId, attempt: job.attemptsMade + 1 }),
        async () => {
            const log = getLogger();
            const handler = aiHandlers[job.name];
            if (!handler) throw new UnrecoverableError(`Unknown job: ${job.name}`);

            const startedAt = Date.now();
            try {
                const result = await handler(job);
                await releaseAiLock(job.data.userId, job.id);
                log.info({ ms: Date.now() - startedAt }, "Job completed");
                return result; // BullMQ ise job.returnvalue me save karta hai → GET /api/jobs/:id
            } catch (error) {
                const final = isFinalAttempt(job) || error instanceof UnrecoverableError;
                log[final ? "error" : "warn"]({ err: error, final }, final ? "Job failed" : "Job failed, will retry");
                if (final) await releaseAiLock(job.data.userId, job.id);
                // error ka message client tak jaata hai (failedReason) — sirf humare likhe messages, andar ka DB/code error nahi
                if (error instanceof AppError || error instanceof UnrecoverableError) throw error;
                throw new Error("Something went wrong. Please try again.", { cause: error });
            }
        },
    );

const processMaintenanceJob = async (job) => {
    if (job.name !== JOB.CLEANUP_STUCK) return;
    const result = await cleanupStuckInterviews();
    if (result.startingRefunded || result.finishingReset) logger.info(result, "Cleaned up stuck interviews");
    return result;
};

const startWorker = async () => {
    try {
        await connectDB();
        await connectRedis();
    } catch (error) {
        logger.fatal({ err: error }, "Worker could not connect to MongoDB / Redis");
        process.exit(1);
    }

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

    logger.info(`Worker running (AI concurrency ${env.WORKER_CONCURRENCY})`);

    // deploy/restart: naye job lena band, chalte job poore hone do. 25s me na ho to nikal jao — wo job "stalled"
    // ho jaayega aur BullMQ use dobara chala dega (agla worker), kuch khota nahi
    const shutdown = async (signal) => {
        logger.info(`${signal} received, worker shutting down`);
        setTimeout(() => process.exit(1), 25000).unref();
        await Promise.all([aiWorker.close(), maintenanceWorker.close()]);
        await connection.quit();
        await Promise.all([disconnectDB(), disconnectRedis()]);
        process.exit(0);
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
};

startWorker();

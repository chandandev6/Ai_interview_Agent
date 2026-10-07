// job aane par kya karna hai — worker.js (asli process) aur tests (test worker) dono yahi use karte hai
import { UnrecoverableError } from "bullmq";
import { logger, getLogger, runWithRequestLogger } from "../lib/logger.js";
import AppError from "../utils/AppError.js";
import { JOB } from "../lib/queue/queues.js";
import { releaseAiLock } from "../lib/queue/aiJobs.js";
import { cleanupStuckInterviews, completeFinish, parseResumeText } from "../modules/interview/interview.service.js";

// attemptsMade = ab tak kitni try FAIL hui. Ye wali bhi fail hui to aur try bachi?
const isFinalAttempt = (job) => job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

const aiHandlers = {
    [JOB.PARSE_RESUME]: async (job) => ({ resume: await parseResumeText(job.data.text) }),
    [JOB.FINISH_INTERVIEW]: (job) => completeFinish(job.data.interviewId, { finalAttempt: isFinalAttempt(job) }),
};

// har job ka apna logger (jobId + API wala reqId) — services ka getLogger() isi ko use karega
export const processAiJob = (job) =>
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

export const processMaintenanceJob = async (job) => {
    if (job.name !== JOB.CLEANUP_STUCK) return;
    const result = await cleanupStuckInterviews();
    if (result.startingRefunded || result.finishingReset) logger.info(result, "Cleaned up stuck interviews");
    return result;
};

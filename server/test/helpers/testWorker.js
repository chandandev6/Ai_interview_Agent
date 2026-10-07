// asli worker.js jaisa hi BullMQ Worker, wahi processors — taaki tests poora queue flow chalaye (API → Redis → worker)
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { AI_QUEUE } from "../../src/lib/queue/queues.js";
import { processAiJob } from "../../src/jobs/processors.js";
import { api, sleep } from "./index.js";

export const startTestWorker = () => {
    const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    const worker = new Worker(AI_QUEUE, processAiJob, { connection, concurrency: 5 });
    return async () => {
        await worker.close();
        await connection.quit();
    };
};

// client jaisa poll: "completed" / "failed" tak
export const waitForJob = async (cookie, jobId, timeoutMs = 20000) => {
    const giveUpAt = Date.now() + timeoutMs;
    while (Date.now() < giveUpAt) {
        const res = await api().get(`/api/jobs/${jobId}`).set("Cookie", cookie);
        if (res.body.data?.status !== "pending") return res.body.data;
        await sleep(100);
    }
    throw new Error(`job ${jobId} still pending after ${timeoutMs}ms`);
};

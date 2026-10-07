// alag process (npm run worker) — queue se jobs nikaal ke slow AI kaam karta hai. API sirf job daalti hai.
// Fayda: API fast rehti hai, worker alag se scale (zyada copies) ho sakta hai, crash hua to job dobara chalta hai
import connectDB, { disconnectDB } from "./config/db.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { logger } from "./lib/logger.js";
import { startWorkers } from "./jobs/startWorkers.js";

const startWorker = async () => {
    try {
        await connectDB();
        await connectRedis();
    } catch (error) {
        logger.fatal({ err: error }, "Worker could not connect to MongoDB / Redis");
        process.exit(1);
    }

    const closeWorkers = await startWorkers();

    // deploy/restart: naye job lena band, chalte job poore hone do. 25s me na ho to nikal jao — wo job "stalled"
    // ho jaayega aur BullMQ use dobara chala dega (agla worker), kuch khota nahi
    const shutdown = async (signal) => {
        logger.info(`${signal} received, worker shutting down`);
        setTimeout(() => process.exit(1), 25000).unref();
        await closeWorkers();
        await Promise.all([disconnectDB(), disconnectRedis()]);
        process.exit(0);
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
};

startWorker();

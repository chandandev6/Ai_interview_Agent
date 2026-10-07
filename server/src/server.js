// sabse pehle env check — galat ho to yahi ruk jaayega, app load hi nahi hoga
import { env } from "./config/env.js";
import app from "./app.js";
import connectDB, { disconnectDB } from "./config/db.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { logger } from "./lib/logger.js";
import { startWorkers } from "./jobs/startWorkers.js";

const PORT = env.PORT;

const startServer = async () => {
    try {
        await connectDB();
    } catch (error) {
        logger.fatal({ err: error }, "Error in connecting to MongoDB");
        process.exit(1);
    }
    try {
        await connectRedis(); // REDIS_URL khaali ho to turant aage
    } catch (error) {
        logger.fatal({ err: error }, "Error in connecting to Redis (is `docker compose up -d` running?)");
        process.exit(1);
    }

    // Render free plan: alag worker service nahi milti — isi process me workers chala do (env.js: RUN_WORKER_IN_API)
    const closeWorkers = env.RUN_WORKER_IN_API ? await startWorkers() : null;

    const server = app.listen(PORT, () => {
        logger.info(`Server running on ${PORT}`);
    });

    // deploy/restart par chalti requests (aur workers ho to chalte AI jobs) poori hone do, phir DB band karo.
    // AI job 5-60s le sakta hai — isliye workers ke saath 25s (Render ~30s baad force kill karta hai)
    const shutdown = (signal) => {
        logger.info(`${signal} received, shutting down`);
        server.close(async () => {
            if (closeWorkers) await closeWorkers();
            await Promise.all([disconnectDB(), disconnectRedis()]);
            process.exit(0);
        });
        setTimeout(() => process.exit(1), closeWorkers ? 25000 : 10000).unref();
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
};

startServer();

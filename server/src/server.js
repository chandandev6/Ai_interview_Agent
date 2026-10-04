// sabse pehle env check — galat ho to yahi ruk jaayega, app load hi nahi hoga
import { env } from "./config/env.js";
import app from "./app.js";
import connectDB, { disconnectDB } from "./config/db.js";
import { logger } from "./lib/logger.js";

const PORT = env.PORT;

const startServer = async () => {
    try {
        await connectDB();
    } catch (error) {
        logger.fatal({ err: error }, "Error in connecting to MongoDB");
        process.exit(1);
    }

    const server = app.listen(PORT, () => {
        logger.info(`Server running on ${PORT}`);
    });

    // deploy/restart par chalti requests poori hone do, phir DB band karo
    const shutdown = (signal) => {
        logger.info(`${signal} received, shutting down`);
        server.close(async () => {
            await disconnectDB();
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
};

startServer();

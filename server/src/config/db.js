import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

const connectDB = async () => {
    // fail hone par throw karo — bina DB ke server start nahi hona chahiye
    await mongoose.connect(env.MONGODB_URL, {
        maxPoolSize: env.MONGO_POOL_SIZE,
    });
    logger.info("MongoDB connected successfully");
};

export const disconnectDB = () => mongoose.connection.close();

export default connectDB;

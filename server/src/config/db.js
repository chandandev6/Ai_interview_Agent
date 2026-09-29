import mongoose from "mongoose";
import { env } from "./env.js";

const connectDB = async () => {
    // fail hone par throw karo — bina DB ke server start nahi hona chahiye
    await mongoose.connect(env.MONGODB_URL, {
        maxPoolSize: env.MONGO_POOL_SIZE,
    });
    console.log("MongoDB connected successfully");
};

export const disconnectDB = () => mongoose.connection.close();

export default connectDB;

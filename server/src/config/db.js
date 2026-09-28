import mongoose from "mongoose";

const connectDB = async () => {
    // fail hone par throw karo — bina DB ke server start nahi hona chahiye
    await mongoose.connect(process.env.MONGODB_URL, {
        maxPoolSize: Number(process.env.MONGO_POOL_SIZE) || 50,
    })
    console.log("MongoDB connected successfully")
}

export const disconnectDB = () => mongoose.connection.close()

export default connectDB

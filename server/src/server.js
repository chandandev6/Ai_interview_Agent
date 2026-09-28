import 'dotenv/config';
import app from './app.js';
import connectDB, { disconnectDB } from './config/db.js';

const PORT = process.env.PORT || 8000

const startServer = async () => {
    try {
        await connectDB();
    }
    catch (error) {
        console.error("Error in connecting to MongoDB", error)
        process.exit(1)
    }

    const server = app.listen(PORT , ()=>{
        console.log(`Server Running on ${PORT}`)
    })

    // deploy/restart par chalti requests poori hone do, phir DB band karo
    const shutdown = (signal) => {
        console.log(`${signal} received, shutting down`)
        server.close(async () => {
            await disconnectDB()
            process.exit(0)
        })
        setTimeout(() => process.exit(1), 10000).unref()
    }
    process.on("SIGTERM", shutdown)
    process.on("SIGINT", shutdown)
}

startServer()

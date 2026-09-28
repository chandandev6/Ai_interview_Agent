// sirf express app — listen yaha nahi (tests me supertest se directly use kar sakte hai)
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.routes.js';
import userRouter from './modules/user/user.routes.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const app = express()

app.use(cors({
    origin: (process.env.CLIENT_URL || "http://localhost:5173").split(","),
    credentials: true,
}))
app.use(express.json({ limit: "1mb" }))
app.use(cookieParser())

// naya feature = naya module + yaha ek line
app.use("/api/auth" , authRouter)
app.use("/api/user" , userRouter)

app.get("/" , (req , res)=>{
    return res.json({message : "Server started"})
})

// load balancer / uptime checks ke liye
app.get("/health" , (req , res)=>{
    return res.json({status : "ok"})
})

app.use(notFound)
app.use(errorHandler)

export default app

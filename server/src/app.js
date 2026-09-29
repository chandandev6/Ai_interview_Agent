// sirf express app — listen yaha nahi (tests me supertest se directly use kar sakte hai)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.routes.js';
import userRouter from './modules/user/user.routes.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { globalLimiter } from './middlewares/rateLimit.js';
import { env } from './config/env.js';

const app = express()

// ORDER MATTERS — request upar se neeche har middleware se guzarti hai

// production me Render/Railway ka proxy beech me hota hai — uske X-Forwarded-For se user ki asli IP lo
// (local me off, warna koi bhi fake header bhej ke apni IP badal sakta hai)
app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false)

app.use(helmet())              // security headers — sabse pehle, taaki error responses par bhi lage
app.use(cors({                 // limiter se pehle, taaki 429 ka message bhi browser padh sake
    origin: env.CLIENT_URL.split(","),
    credentials: true,
}))
app.use(compression())         // responses gzip — kam data, fast load

// load balancer / uptime checks ke liye — limiter se upar, taaki ye kabhi block na ho
app.get("/health" , (req , res)=>{
    return res.json({status : "ok"})
})

app.use(globalLimiter)         // 100 req/min per IP — JSON parse / DB se pehle hi flood rok do
app.use(express.json({ limit: "1mb" }))
app.use(cookieParser())

// naya feature = naya module + yaha ek line
app.use("/api/auth" , authRouter)
app.use("/api/user" , userRouter)

app.get("/" , (req , res)=>{
    return res.json({message : "Server started"})
})

app.use(notFound)
app.use(errorHandler)

export default app

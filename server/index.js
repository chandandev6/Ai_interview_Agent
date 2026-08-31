import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/connectDB.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.route.js';
import userRouter from './routes/user.route.js';
dotenv.config()

const app = express()

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}))
const PORT  = process.env.PORT || 6000

app.use(express.json())
app.use(cookieParser())

app.use("/api/auth" , authRouter)
app.use("/api/user" , userRouter)

app.get("/" , (req , res)=>{
    return res.json({message : "Server started"})
})


app.listen(PORT , ()=>{
    console.log(`Seever Running on ${PORT}`)
    connectDB();
})
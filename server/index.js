import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/connectDB.js';

dotenv.config()

const app = express()

const PORT  = process.env.PORT || 6000

app.get("/" , (req , res)=>{
    return res.json({message : "Server started"})
})


app.listen(PORT , ()=>{
    console.log(`Seever Running on ${PORT}`)
    connectDB();
})
import express from "express";
import isAuth from "../../middlewares/isAuth.js";
import { aiLimiter } from "../../middlewares/rateLimit.js";
import upload from "../../middlewares/upload.js";
import { uploadResume } from "./interview.controller.js";

const interviewRouter = express.Router();

// order: sasta check pehle — login? → limit? → tab hi 5MB file padho → AI call
interviewRouter.post("/resume", isAuth, aiLimiter, upload.single("resume"), uploadResume);

export default interviewRouter;

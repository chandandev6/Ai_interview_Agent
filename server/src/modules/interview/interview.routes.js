import express from "express";
import isAuth from "../../middlewares/isAuth.js";
import { aiLimiter } from "../../middlewares/rateLimit.js";
import upload from "../../middlewares/upload.js";
import validate from "../../middlewares/validate.js";
import { interviewIdParamsSchema, startInterviewSchema, submitAnswerSchema } from "./interview.schema.js";
import { startNewInterview, submitInterviewAnswer, uploadResume } from "./interview.controller.js";

const interviewRouter = express.Router();

// order: sasta check pehle — login? → limit? → tab hi 5MB file padho → AI call
interviewRouter.post("/resume", isAuth, aiLimiter, upload.single("resume"), uploadResume);

// body check pehle — galat data par na credit kate, na AI call ho
interviewRouter.post("/start", isAuth, aiLimiter, validate({ body: startInterviewSchema }), startNewInterview);

// har answer = ek AI call, isliye aiLimiter. Galat id/body par DB ya AI tak nahi jaate
interviewRouter.post(
    "/:id/answer",
    isAuth,
    aiLimiter,
    validate({ params: interviewIdParamsSchema, body: submitAnswerSchema }),
    submitInterviewAnswer,
);

export default interviewRouter;

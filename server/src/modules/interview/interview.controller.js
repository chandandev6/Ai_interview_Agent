import AppError from "../../utils/AppError.js";
import { sendSuccess } from "../../utils/response.js";
import {
    getHistory,
    getInterview,
    getStats,
    requestFinish,
    requestResumeParse,
    startInterview,
    submitAnswer,
} from "./interview.service.js";

// multer ne file req.file me daali hai (buffer = RAM me bytes). File hi na aaye to multer chup rehta hai — yaha check
export const uploadResume = async (req, res) => {
    if (!req.file) {
        throw new AppError(400, 'Please attach your resume as a PDF in the "resume" field.', "RESUME_MISSING");
    }
    // 202 = "le liya, kaam chal raha hai" — result GET /api/jobs/:jobId se
    const { jobId } = await requestResumeParse(req.userId, req.file.buffer);
    return sendSuccess(res, { status: 202, message: "Your resume is being analysed", data: { jobId } });
};

// body validate() ne pehle hi saaf kar di hai
export const startNewInterview = async (req, res) => {
    const result = await startInterview(req.userId, req.body);
    return sendSuccess(res, { status: 201, message: "Interview started", data: result });
};

// params.id + body dono validate() check kar chuka
export const submitInterviewAnswer = async (req, res) => {
    const result = await submitAnswer(req.userId, req.params.id, req.body);
    return sendSuccess(res, { message: "Answer evaluated", data: result });
};

export const finishCurrentInterview = async (req, res) => {
    const { interview, jobId } = await requestFinish(req.userId, req.params.id);
    // pehle hi complete (retry) → report turant. Warna report worker bana raha hai → jobId se poll karo
    if (interview) return sendSuccess(res, { message: "Interview completed", data: { interview } });
    return sendSuccess(res, { status: 202, message: "Your report is being prepared", data: { jobId } });
};

export const getInterviewById = async (req, res) => {
    const interview = await getInterview(req.userId, req.params.id);
    return sendSuccess(res, { data: { interview } });
};

// req.query validate() ne number bana diya hai (page: 1, limit: 10)
export const getInterviewHistory = async (req, res) => {
    const result = await getHistory(req.userId, req.query);
    return sendSuccess(res, { data: result });
};

export const getInterviewStats = async (req, res) => {
    const stats = await getStats(req.userId);
    return sendSuccess(res, { data: stats });
};

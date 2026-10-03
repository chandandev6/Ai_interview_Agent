import AppError from "../../utils/AppError.js";
import { sendSuccess } from "../../utils/response.js";
import {
    finishInterview,
    getHistory,
    getInterview,
    parseResume,
    startInterview,
    submitAnswer,
} from "./interview.service.js";

// multer ne file req.file me daali hai (buffer = RAM me bytes). File hi na aaye to multer chup rehta hai — yaha check
export const uploadResume = async (req, res) => {
    if (!req.file) {
        throw new AppError(400, 'Please attach your resume as a PDF in the "resume" field.', "RESUME_MISSING");
    }
    const resume = await parseResume(req.file.buffer);
    return sendSuccess(res, { message: "Resume parsed", data: { resume } });
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
    const interview = await finishInterview(req.userId, req.params.id);
    return sendSuccess(res, { message: "Interview completed", data: { interview } });
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

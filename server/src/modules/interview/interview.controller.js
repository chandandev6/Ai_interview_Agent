import AppError from "../../utils/AppError.js";
import { sendSuccess } from "../../utils/response.js";
import { parseResume, startInterview } from "./interview.service.js";

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

// interview ke saare server calls — returns { success, message, data }
import api from "./axios.js";

const body = (response) => response.data;

// PDF FormData me — field ka naam "resume" (server multer isi naam se padhta hai)
export const uploadResume = (file) => {
    const form = new FormData();
    form.append("resume", file);
    return api.post("/api/interview/resume", form).then(body);
};

// requestId = har "Start" attempt ka UUID — double-click / retry par credit ek hi baar katta hai
export const startInterview = ({ role, experience, mode, resume, requestId }) =>
    api.post("/api/interview/start", { role, experience, mode, resume, requestId }).then(body);

export const submitAnswer = (interviewId, { questionIndex, answer, timeTakenSec }) =>
    api.post(`/api/interview/${interviewId}/answer`, { questionIndex, answer, timeTakenSec }).then(body);

export const finishInterview = (interviewId) => api.post(`/api/interview/${interviewId}/finish`).then(body);

export const getInterview = (interviewId) => api.get(`/api/interview/${interviewId}`).then(body);

// mode na ho (undefined) to axios use URL me bhejta hi nahi → saare modes
export const getHistory = ({ page = 1, limit = 10, mode } = {}) =>
    api.get("/api/interview/history", { params: { page, limit, mode } }).then(body);

// analytics: summary, skill averages, mode wise, score trend (sirf completed interviews)
export const getStats = () => api.get("/api/interview/stats").then(body);

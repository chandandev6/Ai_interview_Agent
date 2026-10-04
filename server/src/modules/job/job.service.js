import AppError from "../../utils/AppError.js";
import { aiQueue } from "../../lib/queue/queues.js";

// BullMQ ki kai states hai (waiting, delayed, active...) — client ko sirf 3 chahiye: abhi chal raha / ho gaya / fail
export const getJobStatus = async (userId, jobId) => {
    const job = await aiQueue.getJob(jobId);
    // kisi aur ka job bhi "not found" — warna doosre user ka resume result padh sakte the
    if (!job || job.data.userId !== String(userId)) {
        throw new AppError(404, "This task was not found or has expired.", "JOB_NOT_FOUND");
    }

    const state = await job.getState();
    if (state === "completed") return { id: job.id, status: "completed", result: job.returnvalue };
    // worker sirf user ko dikhane layak message hi failedReason me daalta hai (andar ka error nahi)
    if (state === "failed") return { id: job.id, status: "failed", message: job.failedReason };
    return { id: job.id, status: "pending" };
};

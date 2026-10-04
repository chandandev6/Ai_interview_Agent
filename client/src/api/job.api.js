// background jobs (resume parse, report) — server turant jobId deta hai, result yaha baar-baar pooch ke laate hai (polling)
import api from "./axios.js";

const POLL_EVERY_MS = 2000; // 30 request/min — global limit (100/min) me aaram se
const GIVE_UP_AFTER_MS = 3 * 60 * 1000; // worker ke 3 AI try ≈ 3 min max

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// axios error jaisa shape — taaki components ka getErrorMessage(err) aur err.response.data.code waise hi chale
const jobError = (message, code) =>
    Object.assign(new Error(message), { response: { data: { success: false, message, code } } });

export const getJob = (jobId) => api.get(`/api/jobs/${jobId}`).then((response) => response.data);

// job khatam hone tak ruko → result. Fail → error (server ka message)
export const waitForJob = async (jobId) => {
    const giveUpAt = Date.now() + GIVE_UP_AFTER_MS;
    while (Date.now() < giveUpAt) {
        await sleep(POLL_EVERY_MS);
        const { data: job } = await getJob(jobId);
        if (job.status === "completed") return job.result;
        if (job.status === "failed")
            throw jobError(job.message || "Something went wrong. Please try again.", "JOB_FAILED");
    }
    throw jobError("This is taking longer than usual. Please try again in a minute.", "JOB_TIMEOUT");
};

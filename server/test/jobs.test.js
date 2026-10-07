import { afterEach, describe, expect, it } from "vitest";
import { askAiJson } from "../src/lib/ai/openRouter.js";
import { redis } from "../src/config/redis.js";
import { cacheKeys } from "../src/lib/cache.js";
import { CRITERIA, MODES } from "../src/modules/interview/interview.modes.js";
import Interview from "../src/modules/interview/interview.model.js";
import { FAKE_SCORES } from "./helpers/fakeAi.js";
import { answerAll, api, createUser, startInterview } from "./helpers/index.js";
import { startTestWorker, waitForJob } from "./helpers/testWorker.js";

const RESUME = new URL("./fixtures/resume.pdf", import.meta.url).pathname;
const NOT_A_PDF = new URL("./fixtures/not-a-pdf.pdf", import.meta.url).pathname;

const uploadResume = (cookie, file = RESUME) =>
    api()
        .post("/api/interview/resume")
        .set("Cookie", cookie)
        .attach("resume", file, { contentType: "application/pdf" });

let stopWorker = null;
afterEach(async () => {
    await stopWorker?.();
    stopWorker = null;
});

describe("resume parsing job", () => {
    it("API answers 202 + jobId at once; the worker produces the parsed resume", async () => {
        const { cookie } = await createUser();
        const res = await uploadResume(cookie);
        expect(res.status).toBe(202);
        const { jobId } = res.body.data;

        // worker abhi band hai → job queue me wait kar raha hai
        expect((await api().get(`/api/jobs/${jobId}`).set("Cookie", cookie)).body.data.status).toBe("pending");

        stopWorker = startTestWorker();
        const job = await waitForJob(cookie, jobId);
        expect(job.status).toBe("completed");
        expect(job.result.resume.skills).toEqual(["JavaScript", "React", "Node.js"]);
    });

    it("a broken PDF is rejected at once (400), no job is created", async () => {
        const { cookie } = await createUser();
        const res = await uploadResume(cookie, NOT_A_PDF);
        expect(res.status).toBe(400);
        expect(res.body.code).toBe("INVALID_PDF");
    });

    it("only one AI job per user at a time → second upload gets 429", async () => {
        const { cookie } = await createUser();
        expect((await uploadResume(cookie)).status).toBe(202);
        const second = await uploadResume(cookie);
        expect(second.status).toBe(429);
        expect(second.body.code).toBe("AI_JOB_RUNNING");
    });

    it("another user cannot see my job (404)", async () => {
        const a = await createUser();
        const b = await createUser();
        const { jobId } = (await uploadResume(a.cookie)).body.data;
        const res = await api().get(`/api/jobs/${jobId}`).set("Cookie", b.cookie);
        expect(res.status).toBe(404);
        expect(res.body.code).toBe("JOB_NOT_FOUND");
    });
});

describe("finish interview job", () => {
    it("202 → worker writes the report → interview completed with scores computed in code", async () => {
        const { user, cookie } = await createUser();
        const { interviewId } = (await startInterview(cookie)).body.data;
        await answerAll(cookie, interviewId);
        await redis.set(cacheKeys.stats(user._id), "{}"); // purana stats cache — finish ke baad hatna chahiye

        const finish = await api().post(`/api/interview/${interviewId}/finish`).set("Cookie", cookie);
        expect(finish.status).toBe(202);

        // job chal raha hai → dobara Finish = 409 (do report nahi banenge)
        const again = await api().post(`/api/interview/${interviewId}/finish`).set("Cookie", cookie);
        expect(again.status).toBe(409);
        expect(again.body.code).toBe("INTERVIEW_FINISHING");

        stopWorker = startTestWorker();
        const job = await waitForJob(cookie, finish.body.data.jobId);
        expect(job).toMatchObject({ status: "completed", result: { interviewId } });

        const { interview } = (await api().get(`/api/interview/${interviewId}`).set("Cookie", cookie)).body.data;
        expect(interview.status).toBe("completed");
        expect(interview.report.averages).toEqual(FAKE_SCORES);
        // weighted overall: technical mode ke weights × averages × 10
        const expected = Math.round(
            CRITERIA.reduce((sum, key) => sum + FAKE_SCORES[key] * MODES.technical.weights[key], 0) * 10,
        );
        expect(interview.report.overallScore).toBe(expected);
        expect(await redis.exists(cacheKeys.stats(user._id))).toBe(0);

        // complete ho chuka → Finish = wahi report turant (200)
        const done = await api().post(`/api/interview/${interviewId}/finish`).set("Cookie", cookie);
        expect(done.status).toBe(200);
        expect(done.body.data.interview.report.overallScore).toBe(expected);
    });

    it("AI keeps failing → 3 tries, then 'failed' and the interview goes back to in_progress", async () => {
        const { cookie } = await createUser();
        const { interviewId } = (await startInterview(cookie)).body.data;
        await answerAll(cookie, interviewId);
        askAiJson.mockRejectedValue(new Error("OpenRouter is down")); // ab har AI call fail

        const { jobId } = (await api().post(`/api/interview/${interviewId}/finish`).set("Cookie", cookie)).body.data;
        stopWorker = startTestWorker();
        const job = await waitForJob(cookie, jobId, 25000); // backoff 2s + 4s

        expect(job.status).toBe("failed");
        expect(job.message).toBe("AI is busy right now, please click Finish again.");
        expect(askAiJson).toHaveBeenCalledTimes(1 + 5 + 3); // questions + 5 answers + 3 report tries
        expect((await Interview.findById(interviewId)).status).toBe("in_progress"); // user dobara Finish daba sake
        expect(await redis.exists(`ai-lock:${(await Interview.findById(interviewId)).userId}`)).toBe(0);
    });
});

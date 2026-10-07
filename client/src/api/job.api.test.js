import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "./axios.js";
import { waitForJob } from "./job.api.js";
import getErrorMessage from "../utils/getErrorMessage.js";

vi.mock("./axios.js", () => ({ default: { get: vi.fn() } }));

// server ka { success, message, data: job } shape
const reply = (job) => Promise.resolve({ data: { success: true, data: job } });

beforeEach(() => vi.useFakeTimers()); // 2s ke poll ka asli wait nahi — time khud aage badhate hai
afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
});

describe("waitForJob (polling)", () => {
    it("keeps asking every 2 s until the job is completed, then returns the result", async () => {
        api.get
            .mockReturnValueOnce(reply({ status: "pending" }))
            .mockReturnValueOnce(reply({ status: "pending" }))
            .mockReturnValueOnce(reply({ status: "completed", result: { resume: { skills: ["Go"] } } }));

        const promise = waitForJob("job-1");
        await vi.advanceTimersByTimeAsync(6000);

        await expect(promise).resolves.toEqual({ resume: { skills: ["Go"] } });
        expect(api.get).toHaveBeenCalledTimes(3);
        expect(api.get).toHaveBeenCalledWith("/api/jobs/job-1");
    });

    it("failed job → error that getErrorMessage() can read (same as an axios error)", async () => {
        api.get.mockReturnValue(
            reply({ status: "failed", message: "AI is busy right now, please click Finish again." }),
        );

        const promise = waitForJob("job-2");
        const check = expect(promise).rejects.toMatchObject({ response: { data: { code: "JOB_FAILED" } } });
        await vi.advanceTimersByTimeAsync(2000);
        await check;
        expect(getErrorMessage(await promise.catch((error) => error))).toBe(
            "AI is busy right now, please click Finish again.",
        );
    });

    it("gives up after 3 minutes with a friendly message", async () => {
        api.get.mockImplementation(() => reply({ status: "pending" }));

        const promise = waitForJob("job-3");
        const check = expect(promise).rejects.toMatchObject({ response: { data: { code: "JOB_TIMEOUT" } } });
        await vi.advanceTimersByTimeAsync(3 * 60 * 1000 + 2000);
        await check;
    });
});

import { describe, expect, it } from "vitest";
import { api } from "./helpers/index.js";

describe("health & basics", () => {
    it("/health says ok", async () => {
        const res = await api().get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });

    it("/ready checks MongoDB and Redis", async () => {
        const res = await api().get("/ready");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ready", db: "ok", redis: "ok" });
    });

    it("unknown route → 404 in our JSON shape, with a request id", async () => {
        const res = await api().get("/api/does-not-exist");
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.headers["x-request-id"]).toMatch(/^[\w-]+$/);
    });

    it("errors include the requestId so support can find the logs", async () => {
        const res = await api().get("/api/interview/stats").set("X-Request-Id", "trace-123");
        expect(res.status).toBe(401);
        expect(res.headers["x-request-id"]).toBe("trace-123");
        expect(res.body.requestId).toBe("trace-123");
    });
});

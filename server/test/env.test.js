import { describe, expect, it } from "vitest";
import { parseEnv } from "../src/config/env.js";

// minimum jo har jagah chahiye — har test isme apni cheez badal ke dekhta hai
const base = {
    MONGODB_URL: "mongodb://localhost/test",
    JWT_SECRET: "test-jwt-secret-at-least-16-chars",
    FIREBASE_PROJECT_ID: "test-project",
    OPENROUTER_API_KEY: "key",
    REDIS_URL: "redis://localhost:6380",
};
const production = {
    ...base,
    NODE_ENV: "production",
    CLIENT_URL: "https://interviewiq.vercel.app",
    SMTP_HOST: "smtp.gmail.com",
    SMTP_USER: "me@gmail.com",
    SMTP_PASS: "app-password",
};
const failedKeys = (result) => result.error.issues.map((issue) => issue.path.join("."));

describe("env rules (deploy)", () => {
    it("defaults: worker NOT in API, 1 proxy hop", () => {
        const result = parseEnv(base);
        expect(result.success).toBe(true);
        expect(result.data.RUN_WORKER_IN_API).toBe(false);
        expect(result.data.TRUST_PROXY_HOPS).toBe(1);
    });

    it('RUN_WORKER_IN_API: "true" → true, "false" → false (not coerced to true)', () => {
        expect(parseEnv({ ...base, RUN_WORKER_IN_API: "true" }).data.RUN_WORKER_IN_API).toBe(true);
        expect(parseEnv({ ...base, RUN_WORKER_IN_API: "false" }).data.RUN_WORKER_IN_API).toBe(false);
        expect(parseEnv({ ...base, RUN_WORKER_IN_API: "yes" }).success).toBe(false);
    });

    it("TRUST_PROXY_HOPS is read as a number", () => {
        expect(parseEnv({ ...base, TRUST_PROXY_HOPS: "2" }).data.TRUST_PROXY_HOPS).toBe(2);
        expect(parseEnv({ ...base, TRUST_PROXY_HOPS: "-1" }).success).toBe(false);
    });

    it("a valid production config passes", () => {
        expect(parseEnv(production).success).toBe(true);
    });

    it("production refuses an http:// CLIENT_URL (secure cookie would never be sent)", () => {
        const result = parseEnv({ ...production, CLIENT_URL: "https://ok.vercel.app,http://insecure.com" });
        expect(result.success).toBe(false);
        expect(failedKeys(result)).toEqual(["CLIENT_URL"]);
    });

    it("production still needs SMTP", () => {
        const result = parseEnv({ ...production, SMTP_PASS: undefined });
        expect(failedKeys(result)).toEqual(["SMTP_PASS"]);
    });

    it("development allows http://localhost", () => {
        expect(parseEnv({ ...base, CLIENT_URL: "http://localhost:5173" }).success).toBe(true);
    });
});

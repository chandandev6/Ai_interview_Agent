// tests ke chhote helpers — user banao + login cookie, interview shuru karo
import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import genToken from "../../src/config/token.js";
import User from "../../src/modules/user/user.model.js";

export const api = () => request(app);

let counter = 0;

// seedha DB me verified user + uska JWT cookie (login API ko har test me dohraane ki zarurat nahi)
export const createUser = async ({ credit = 500, ...fields } = {}) => {
    counter += 1;
    const user = await User.create({
        name: `Test User ${counter}`,
        email: `user${counter}-${randomUUID().slice(0, 8)}@example.com`,
        isVerified: true,
        credit,
        ...fields,
    });
    return { user, cookie: `token=${genToken(user._id.toString())}` };
};

export const startBody = (overrides = {}) => ({
    role: "Backend Developer",
    experience: "Fresher",
    mode: "technical",
    requestId: randomUUID(),
    ...overrides,
});

export const startInterview = (cookie, overrides) =>
    api().post("/api/interview/start").set("Cookie", cookie).send(startBody(overrides));

// saare 5 answers de do (fake AI score karega)
export const answerAll = async (cookie, interviewId) => {
    for (let questionIndex = 0; questionIndex < 5; questionIndex++) {
        const res = await api()
            .post(`/api/interview/${interviewId}/answer`)
            .set("Cookie", cookie)
            .send({ questionIndex, answer: `My answer ${questionIndex}`, timeTakenSec: 30 });
        if (res.status !== 200) throw new Error(`answer ${questionIndex} failed: ${res.status} ${res.text}`);
    }
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

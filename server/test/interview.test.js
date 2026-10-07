import { describe, expect, it } from "vitest";
import { askAiJson } from "../src/lib/ai/openRouter.js";
import Transaction from "../src/modules/credit/transaction.model.js";
import Interview from "../src/modules/interview/interview.model.js";
import User from "../src/modules/user/user.model.js";
import { FAKE_SCORES } from "./helpers/fakeAi.js";
import { api, createUser, startBody, startInterview } from "./helpers/index.js";

const creditOf = async (userId) => (await User.findById(userId)).credit;

describe("start interview + credits", () => {
    it("charges 50 credits, writes a ledger row and returns 5 questions", async () => {
        const { user, cookie } = await createUser({ credit: 500 });
        const res = await startInterview(cookie);

        expect(res.status).toBe(201);
        expect(res.body.data.credit).toBe(450);
        expect(res.body.data.questions).toHaveLength(5);
        expect(res.body.data.questions.map((q) => q.difficulty)).toEqual(["easy", "easy", "medium", "medium", "hard"]);
        expect(await creditOf(user._id)).toBe(450);

        const ledger = await Transaction.find({ userId: user._id });
        expect(ledger).toHaveLength(1);
        expect(ledger[0]).toMatchObject({ type: "interview", amount: -50, balanceAfter: 450 });
    });

    it("not enough credits → 402 and nothing changes", async () => {
        const { user, cookie } = await createUser({ credit: 49 });
        const res = await startInterview(cookie);

        expect(res.status).toBe(402);
        expect(res.body.code).toBe("NOT_ENOUGH_CREDITS");
        expect(await creditOf(user._id)).toBe(49);
        expect(await Interview.countDocuments()).toBe(0);
        expect(await Transaction.countDocuments()).toBe(0);
    });

    // asli bug jo is design ne roka: "pehle check, phir minus" alag queries me ho to 10 saath aayi requests sab
    // check pass kar leti (sabko 50 dikhta) aur credit -450 ho jaata. $gte + $inc ek atomic query me hai
    it("RACE: 10 parallel starts with credits for only 1 → exactly 1 succeeds, credit never negative", async () => {
        const { user, cookie } = await createUser({ credit: 50 });

        const results = await Promise.all(Array.from({ length: 10 }, () => startInterview(cookie)));
        const statuses = results.map((res) => res.status).sort();

        expect(statuses.filter((status) => status === 201)).toHaveLength(1);
        expect(statuses.filter((status) => status === 402)).toHaveLength(9);
        expect(await creditOf(user._id)).toBe(0);
        expect(await Interview.countDocuments({ userId: user._id })).toBe(1); // 402 wale reserve hat gaye
        expect(await Transaction.countDocuments({ userId: user._id, type: "interview" })).toBe(1);
    });

    it("double-click (same requestId) → same interview, charged once", async () => {
        const { user, cookie } = await createUser({ credit: 500 });
        const body = startBody();

        const first = await api().post("/api/interview/start").set("Cookie", cookie).send(body);
        const second = await api().post("/api/interview/start").set("Cookie", cookie).send(body);

        expect(first.status).toBe(201);
        expect(second.status).toBe(201);
        expect(second.body.data.interviewId).toBe(first.body.data.interviewId);
        expect(await creditOf(user._id)).toBe(450);
    });

    it("AI down while starting → 503, credits refunded, nothing left behind", async () => {
        const { user, cookie } = await createUser({ credit: 500 });
        askAiJson.mockRejectedValueOnce(new Error("OpenRouter is down"));

        const res = await startInterview(cookie);

        expect(res.status).toBe(503);
        expect(res.body.code).toBe("AI_UNAVAILABLE");
        expect(await creditOf(user._id)).toBe(500);
        expect(await Interview.countDocuments()).toBe(0);
        const types = (await Transaction.find({ userId: user._id }).sort({ createdAt: 1 })).map((t) => t.type);
        expect(types).toEqual(["interview", "refund"]); // passbook me dono dikhte hai
    });

    it("rejects invalid input with 400 (no charge, no AI call)", async () => {
        const { user, cookie } = await createUser();
        const res = await startInterview(cookie, { mode: "dance-battle", requestId: "not-a-uuid" });
        expect(res.status).toBe(400);
        expect(askAiJson).not.toHaveBeenCalled();
        expect(await creditOf(user._id)).toBe(500);
    });
});

describe("answers", () => {
    it("scores an answer, and the same question cannot be answered twice", async () => {
        const { cookie } = await createUser();
        const { interviewId } = (await startInterview(cookie)).body.data;
        const send = () =>
            api()
                .post(`/api/interview/${interviewId}/answer`)
                .set("Cookie", cookie)
                .send({ questionIndex: 0, answer: "Event loop runs callbacks", timeTakenSec: 20 });

        const first = await send();
        expect(first.status).toBe(200);
        expect(first.body.data.scores).toEqual(FAKE_SCORES);

        const again = await send();
        expect(again.status).toBe(409);
        expect(again.body.code).toBe("ALREADY_ANSWERED");
    });

    it("an empty answer scores 0 without calling the AI", async () => {
        const { cookie } = await createUser();
        const { interviewId } = (await startInterview(cookie)).body.data;
        askAiJson.mockClear();

        const res = await api()
            .post(`/api/interview/${interviewId}/answer`)
            .set("Cookie", cookie)
            .send({ questionIndex: 1, answer: "   ", timeTakenSec: 5 });

        expect(res.status).toBe(200);
        expect(Object.values(res.body.data.scores)).toEqual([0, 0, 0, 0]);
        expect(askAiJson).not.toHaveBeenCalled();
    });

    it("the client cannot claim more time than the limit", async () => {
        const { cookie } = await createUser();
        const { interviewId } = (await startInterview(cookie)).body.data;
        await api()
            .post(`/api/interview/${interviewId}/answer`)
            .set("Cookie", cookie)
            .send({ questionIndex: 0, answer: "hi", timeTakenSec: 99999 });
        const saved = await Interview.findById(interviewId);
        expect(saved.questions[0].timeTakenSec).toBe(60); // easy = 60s
    });
});

// OWNERSHIP: user B ko user A ka interview na dikhe, na badal sake. 403 nahi 404 — warna B ko pata chal jaata ki id exist karti hai
describe("ownership", () => {
    it("another user cannot answer, read or finish my interview", async () => {
        const a = await createUser();
        const b = await createUser();
        const { interviewId } = (await startInterview(a.cookie)).body.data;

        const answer = await api()
            .post(`/api/interview/${interviewId}/answer`)
            .set("Cookie", b.cookie)
            .send({ questionIndex: 0, answer: "sneaky", timeTakenSec: 10 });
        const read = await api().get(`/api/interview/${interviewId}`).set("Cookie", b.cookie);
        const finish = await api().post(`/api/interview/${interviewId}/finish`).set("Cookie", b.cookie);

        expect([answer.status, read.status, finish.status]).toEqual([404, 404, 404]);
        const saved = await Interview.findById(interviewId);
        expect(saved.questions[0].answer ?? null).toBeNull(); // A ka interview bilkul nahi badla
        expect(saved.status).toBe("in_progress");
    });

    it("history only shows my own interviews", async () => {
        const a = await createUser();
        const b = await createUser();
        await startInterview(a.cookie);
        await startInterview(a.cookie);
        await startInterview(b.cookie);

        const res = await api().get("/api/interview/history").set("Cookie", a.cookie);
        expect(res.status).toBe(200);
        expect(res.body.data.pagination.total).toBe(2);
    });
});

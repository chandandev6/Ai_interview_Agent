import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { chargeCredits } from "../src/modules/credit/credit.service.js";
import Transaction from "../src/modules/credit/transaction.model.js";
import Interview from "../src/modules/interview/interview.model.js";
import { cleanupStuckInterviews } from "../src/modules/interview/interview.service.js";
import User from "../src/modules/user/user.model.js";
import { createUser, startInterview } from "./helpers/index.js";

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000);

// timestamps: true wala updatedAt mongoose khud set karta hai — purana dikhane ke liye seedha collection par likho.
// Raw collection string id ko ObjectId nahi banata (mongoose banata hai) — khud banao, warna kuch match hi nahi hota
const makeOld = (interviewId, status, minutes) =>
    Interview.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(String(interviewId)) },
        { $set: { status, updatedAt: minutesAgo(minutes) } },
    );

describe("cleanup job (stuck interviews)", () => {
    it("server crashed after charging: stuck 'starting' is refunded exactly once, then removed", async () => {
        const { user } = await createUser({ credit: 500 });
        const stuck = await Interview.create({
            userId: user._id,
            requestId: crypto.randomUUID(),
            role: "Dev",
            experience: "Fresher",
            mode: "hr",
            creditsUsed: 50,
        });
        await chargeCredits(user._id, 50, { interviewId: stuck._id });
        await makeOld(stuck._id, "starting", 11);

        expect(await cleanupStuckInterviews()).toEqual({ startingRefunded: 1, finishingReset: 0 });
        expect(await cleanupStuckInterviews()).toEqual({ startingRefunded: 0, finishingReset: 0 }); // dobara chale to kuch nahi

        expect((await User.findById(user._id)).credit).toBe(500);
        expect(await Transaction.countDocuments({ interviewId: stuck._id, type: "refund" })).toBe(1);
        expect(await Interview.exists({ _id: stuck._id })).toBeNull();
    });

    it("never refunds a 'starting' interview that was never charged", async () => {
        const { user } = await createUser({ credit: 500 });
        const stuck = await Interview.create({
            userId: user._id,
            requestId: crypto.randomUUID(),
            role: "Dev",
            experience: "Fresher",
            mode: "hr",
            creditsUsed: 50,
        });
        await makeOld(stuck._id, "starting", 30);

        await cleanupStuckInterviews();
        expect((await User.findById(user._id)).credit).toBe(500); // 550 nahi
        expect(await Transaction.countDocuments()).toBe(0);
    });

    it("stuck 'finishing' goes back to in_progress; recent ones are left alone", async () => {
        const { cookie } = await createUser();
        const old = (await startInterview(cookie)).body.data.interviewId;
        const fresh = (await startInterview(cookie)).body.data.interviewId;
        const youngStart = (await startInterview(cookie)).body.data.interviewId;
        await makeOld(old, "finishing", 16);
        await makeOld(fresh, "finishing", 2); // job shayad abhi chal raha hai
        await makeOld(youngStart, "starting", 2);

        expect(await cleanupStuckInterviews()).toEqual({ startingRefunded: 0, finishingReset: 1 });
        expect((await Interview.findById(old)).status).toBe("in_progress");
        expect((await Interview.findById(fresh)).status).toBe("finishing");
        expect((await Interview.findById(youngStart)).status).toBe("starting");
    });
});

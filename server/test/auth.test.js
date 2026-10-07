import { describe, expect, it } from "vitest";
import { sendMail } from "../src/lib/mail/mailer.js";
import Transaction from "../src/modules/credit/transaction.model.js";
import User from "../src/modules/user/user.model.js";
import { api, createUser } from "./helpers/index.js";

const account = { name: "Asha Verma", email: "Asha@Example.com", password: "correct-horse-1" };

// fake mailer ko jo email "bheja" gaya, usme se link ka token nikalo
const tokenFromLastEmail = () => {
    const { text } = sendMail.mock.calls.at(-1)[0];
    return text.match(/token=([a-f0-9]{64})/)[1];
};

const cookieFrom = (res) => res.headers["set-cookie"]?.find((cookie) => cookie.startsWith("token="));

describe("email + password auth", () => {
    it("register → verify email → login works, and the email is lowercased", async () => {
        const register = await api().post("/api/auth/register").send(account);
        expect(register.status).toBe(201);
        expect(register.body.data).toEqual({ email: "asha@example.com" });
        expect(sendMail).toHaveBeenCalledTimes(1);

        // verify se pehle login nahi
        const early = await api().post("/api/auth/login").send(account);
        expect(early.status).toBe(403);
        expect(early.body.code).toBe("EMAIL_NOT_VERIFIED");

        const verify = await api().post("/api/auth/verify-email").send({ token: tokenFromLastEmail() });
        expect(verify.status).toBe(200);
        expect(cookieFrom(verify)).toMatch(/HttpOnly/);

        const login = await api().post("/api/auth/login").send(account);
        expect(login.status).toBe(200);
        expect(login.body.data.user.email).toBe("asha@example.com");
        expect(login.body.data.user.password).toBeUndefined(); // hash kabhi response me nahi
    });

    it("new account gets 500 credits and exactly one signup-bonus ledger row", async () => {
        await api().post("/api/auth/register").send(account);
        await api().post("/api/auth/register").send(account); // unverified account par dobara register
        const user = await User.findOne({ email: "asha@example.com" });
        expect(user.credit).toBe(500);
        expect(await Transaction.countDocuments({ userId: user._id, type: "signup_bonus" })).toBe(1);
    });

    it("a verification link works only once", async () => {
        await api().post("/api/auth/register").send(account);
        const token = tokenFromLastEmail();
        expect((await api().post("/api/auth/verify-email").send({ token })).status).toBe(200);
        const again = await api().post("/api/auth/verify-email").send({ token });
        expect(again.status).toBe(400);
        expect(again.body.code).toBe("INVALID_VERIFICATION_LINK");
    });

    it("wrong password and unknown email give the same 401 (no hint which emails exist)", async () => {
        await api().post("/api/auth/register").send(account);
        await api().post("/api/auth/verify-email").send({ token: tokenFromLastEmail() });

        const wrong = await api()
            .post("/api/auth/login")
            .send({ ...account, password: "wrong-password" });
        const unknown = await api()
            .post("/api/auth/login")
            .send({ ...account, email: "nobody@example.com" });
        expect(wrong.status).toBe(401);
        expect(unknown.status).toBe(401);
        expect(wrong.body.message).toBe(unknown.body.message);
    });

    it("rejects bad input before touching the database", async () => {
        const res = await api().post("/api/auth/register").send({ name: "A", email: "not-an-email", password: "123" });
        expect(res.status).toBe(400);
        expect(sendMail).not.toHaveBeenCalled();
    });

    it("registering an already verified email → 409", async () => {
        await createUser({ email: "taken@example.com" });
        const res = await api()
            .post("/api/auth/register")
            .send({ ...account, email: "taken@example.com" });
        expect(res.status).toBe(409);
    });
});

describe("protected routes", () => {
    it("current-user needs a valid token", async () => {
        expect((await api().get("/api/user/current-user")).status).toBe(401);
        const fake = await api().get("/api/user/current-user").set("Cookie", "token=not-a-real-jwt");
        expect(fake.status).toBe(401);

        const { user, cookie } = await createUser();
        const res = await api().get("/api/user/current-user").set("Cookie", cookie);
        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe(user.email);
    });

    it("logout clears the cookie", async () => {
        const res = await api().post("/api/auth/logout");
        expect(res.status).toBe(200);
        expect(cookieFrom(res)).toMatch(/token=;/);
    });
});

// AI job queue me daalna — ek user ka ek time par sirf EK AI job (Redis lock). Ek user 20 resume daal ke
// queue na bhar de aur baaki users ka kaam ruk jaaye
import { randomUUID } from "node:crypto";
import { redis, isRedisReady } from "../../config/redis.js";
import AppError from "../../utils/AppError.js";
import { getLogger } from "../logger.js";
import { aiQueue } from "./queues.js";

// lock apne aap itne der me hat jaata hai — worker mar gaya aur release na kar paaya tab bhi user hamesha ke liye block na ho.
// 3 try × 60s AI timeout + backoff ≈ 3.2 min, isliye 5 min
const LOCK_TTL_SECONDS = 5 * 60;
const lockKey = (userId) => `ai-lock:${userId}`;

// sirf APNA lock hatao: value = jobId match ho tab hi DEL. Check + delete ek Lua script me (atomic) — warna beech me
// lock expire hokar kisi naye job ka ban sakta tha aur hum uska lock hata dete
const RELEASE_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
end
return 0`;

const queueDown = () =>
    new AppError(503, "AI service is busy right now, please try again in a minute.", "QUEUE_UNAVAILABLE");

// return: jobId — client isse GET /api/jobs/:id par result poochta hai
export const enqueueAiJob = async (name, userId, data) => {
    if (!isRedisReady()) throw queueDown();

    const jobId = randomUUID();
    // SET ... NX = sirf tab set karo jab key na ho → do request saath aaye to ek hi jeetegi
    const locked = await redis.set(lockKey(userId), jobId, "EX", LOCK_TTL_SECONDS, "NX").catch(() => {
        throw queueDown();
    });
    if (!locked) {
        throw new AppError(429, "You already have an AI task running. Please wait for it to finish.", "AI_JOB_RUNNING");
    }

    try {
        // reqId bhi job me — worker ke logs API request se jud jaate hai (ek hi ID se poori kahani)
        const reqId = getLogger().bindings?.().reqId;
        await aiQueue.add(name, { ...data, userId: String(userId), reqId }, { jobId });
    } catch (error) {
        await releaseAiLock(userId, jobId);
        getLogger().error({ err: error }, "Could not add AI job to the queue");
        throw queueDown();
    }
    return jobId;
};

// worker job khatam (pass ya aakhri fail) hone par bulata hai
export const releaseAiLock = (userId, jobId) =>
    redis
        .eval(RELEASE_LOCK_SCRIPT, 1, lockKey(userId), jobId)
        .catch((error) => getLogger().warn({ err: error }, "Could not release AI lock (it will expire on its own)"));

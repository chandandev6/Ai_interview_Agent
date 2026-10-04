// cache-aside: pehle Redis me dekho → mila to wahi do (hit) → nahi to DB se lao, Redis me rakh do (miss).
// Redis fail ho to bas DB se do — cache sirf speed ke liye hai, uski wajah se request kabhi fail nahi honi chahiye
import { redis, isRedisReady } from "../config/redis.js";
import { getLogger } from "./logger.js";

// saari keys ek jagah — set aur clear dono yahi naam use kare (typo = kabhi clear na hone wala cache)
export const cacheKeys = {
    user: (userId) => `user:${userId}`,
    stats: (userId) => `stats:${userId}`,
};

export const cached = async (key, ttlSeconds, load) => {
    if (!isRedisReady()) return load();

    try {
        const hit = await redis.get(key);
        if (hit) return JSON.parse(hit);
    } catch (error) {
        getLogger().warn({ err: error, key }, "Cache read failed");
    }

    const value = await load();
    // await nahi — user ko cache save hone ka wait kyun karaye. EX = itne second baad Redis khud delete kar dega
    redis
        .set(key, JSON.stringify(value), "EX", ttlSeconds)
        .catch((error) => getLogger().warn({ err: error, key }, "Cache write failed"));
    return value;
};

// data badla → purani copy hatao, agli request DB se taaza laayegi. Fail ho to TTL ke baad khud hat jaayegi
export const clearCache = async (...keys) => {
    if (!isRedisReady()) return;
    try {
        await redis.del(...keys);
    } catch (error) {
        getLogger().warn({ err: error, keys }, "Cache clear failed");
    }
};

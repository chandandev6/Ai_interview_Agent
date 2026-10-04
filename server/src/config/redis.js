// Redis = RAM me chalne wala fast database. Yaha: rate-limit counters (sab servers ka ek hi counter) + cache.
// REDIS_URL khaali (local dev) → redis = null → in-memory limiter, koi cache nahi. App waise hi chalta hai.
import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

export const redis = env.REDIS_URL
    ? new Redis(env.REDIS_URL, {
          // Redis down ho to command bas 1 reconnect try tak ruke, phir error → hum DB par chale jaate hai (fail open)
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
          // reconnect ki koshish badhte gap par, max 2s — Redis wapas aate hi khud jud jaata hai
          retryStrategy: (times) => Math.min(times * 200, 2000),
      })
    : null;

// "ready" = connected aur commands le raha hai. Iske bina cache/limiter Redis ko chhod dete hai (wait nahi karte)
export const isRedisReady = () => redis?.status === "ready";

if (redis) {
    // har reconnect try par error aata hai — log sirf ek baar, warna har 2s me ek line
    let downLogged = false;
    redis.on("error", (error) => {
        if (downLogged) return;
        downLogged = true;
        logger.warn({ err: error }, "Redis connection error — using MongoDB without cache until it is back");
    });
    redis.on("ready", () => {
        if (downLogged) logger.info("Redis reconnected");
        downLogged = false;
    });
}

// startup par Redis zaruri (MongoDB jaisa): rate-limit store apni Lua scripts isi waqt load karta hai.
// Tab Redis na mile to wo store hamesha ke liye toota rehta → isliye yahi ruk jao. Baad ke outage me app chalta rehta hai
export const connectRedis = () =>
    new Promise((resolve, reject) => {
        if (!redis || isRedisReady()) return resolve();
        const timer = setTimeout(() => reject(new Error(`Redis not reachable at ${env.REDIS_URL}`)), 5000);
        redis.once("ready", () => {
            clearTimeout(timer);
            logger.info("Redis connected successfully");
            resolve();
        });
    });

export const disconnectRedis = () => redis?.quit();

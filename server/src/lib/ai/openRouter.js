import axios from "axios";
import { env } from "../../config/env.js";
import { getLogger } from "../logger.js";

// dono ka API OpenAI jaisa hai (same request/response shape) — sirf URL, key aur model alag
const PROVIDERS = {
    openrouter: {
        url: "https://openrouter.ai/api/v1/chat/completions",
        apiKey: env.OPENROUTER_API_KEY,
        // pehla main model, baaki backup — OpenRouter list me se jo free/available ho usse jawab dilwata hai
        models: [env.OPENROUTER_MODEL, ...env.OPENROUTER_FALLBACK_MODELS],
    },
    // Groq me backup list ("models") wala feature nahi — ek hi model. Fail par askAiJson / BullMQ retry karte hai
    groq: {
        url: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: env.GROQ_API_KEY,
        models: [env.GROQ_MODEL],
    },
};
const { url: AI_URL, apiKey: AI_KEY, models: MODELS } = PROVIDERS[env.AI_PROVIDER];

// kuch models JSON ko ```json ... ``` me lapet dete hai ya aage-peeche text likh dete hai — sirf { ... } wala hissa lo
const extractJson = (text) => {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) {
        throw new Error("AI reply contains no JSON object");
    }
    return JSON.parse(text.slice(start, end + 1));
};

// messages: [{ role: "system" | "user" | "assistant", content: "..." }]
export const askAi = async (messages, { json = false } = {}) => {
    try {
        const response = await axios.post(
            AI_URL,
            {
                ...(MODELS.length > 1 ? { models: MODELS } : { model: MODELS[0] }),
                messages,
                ...(json && { response_format: { type: "json_object" } }),
            },
            {
                headers: {
                    Authorization: `Bearer ${AI_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 60000,
            },
        );

        // OpenRouter kabhi status 200 ke saath body me error bhejta hai (sab models busy) — usse asli error banao
        if (response.data?.error) {
            throw new Error(`AI provider error: ${response.data.error.message || JSON.stringify(response.data.error)}`);
        }

        // kis model ne jawab diya (fallback list me se) — error me dikhe to debug aasaan
        const { model, choices } = response.data;
        const content = choices?.[0]?.message?.content;
        if (!content) {
            throw new Error(`Empty response from AI (${model}, finish: ${choices?.[0]?.finish_reason})`);
        }
        try {
            return json ? extractJson(content) : content;
        } catch (error) {
            // cause = asli error bhi saath rahe (stack trace), sirf message me model ka naam jodte hai
            throw new Error(`${error.message} (${model}): ${content.slice(0, 120)}`, { cause: error });
        }
    } catch (error) {
        getLogger().error({ aiError: error.response?.data?.error?.message || error.message }, "askAi request failed");
        throw error;
    }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// free models busy/flaky rehte hai — 2 retry (total 3 try). Request ke andar wale calls (start, answer) ke liye;
// queue jobs retries: 0 dete hai kyunki waha BullMQ retry karta hai
const DEFAULT_RETRIES = 2;
const RETRY_BASE_MS = 1000;

// exponential backoff: 1s, 2s, 4s... + thoda random (jitter) — sab users ek hi pal me dobara na maarein
const retryDelay = (attempt) => RETRY_BASE_MS * 2 ** (attempt - 1) + Math.random() * 300;

// AI ka jawab = untrusted input (jaise request body): parse → zod check → galat ho to dobara maango
// return: schema se saaf kiya hua data. Sab try fail → error throw (caller credits refund karke 503 dega)
export const askAiJson = async (messages, schema, { retries = DEFAULT_RETRIES } = {}) => {
    let lastError;
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
            const result = schema.safeParse(await askAi(messages, { json: true }));
            if (result.success) {
                return result.data;
            }
            lastError = new Error(
                "AI reply failed validation: " +
                    result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
            );
        } catch (error) {
            lastError = error;
        }
        getLogger().warn(`AI attempt ${attempt} failed: ${lastError.message}`);
        if (attempt <= retries) await sleep(retryDelay(attempt));
    }
    throw lastError;
};

import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

// setup.js AI ko fake karta hai — yaha ASLI openRouter.js chahiye, bas network (axios.post) nakli
const loadAi = async (vars) => {
    for (const [key, value] of Object.entries(vars)) vi.stubEnv(key, value);
    vi.resetModules(); // env.js + openRouter.js naye env ke saath dobara load ho
    return vi.importActual("../src/lib/ai/openRouter.js");
};

const reply = (content, model = "test-model") => ({ data: { model, choices: [{ message: { content } }] } });

afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe("AI provider", () => {
    it("groq: Groq URL, Groq key, single model (no OpenRouter backup list)", async () => {
        const post = vi.spyOn(axios, "post").mockResolvedValue(reply('{"ok":true}'));
        const { askAi } = await loadAi({
            AI_PROVIDER: "groq",
            GROQ_API_KEY: "gsk_test",
            GROQ_MODEL: "openai/gpt-oss-120b",
        });

        expect(await askAi([{ role: "user", content: "hi" }], { json: true })).toEqual({ ok: true });

        const [url, body, options] = post.mock.calls[0];
        expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
        expect(body.model).toBe("openai/gpt-oss-120b");
        expect(body.models).toBeUndefined();
        expect(options.headers.Authorization).toBe("Bearer gsk_test");
    });

    it("openrouter: OpenRouter URL + backup models list", async () => {
        const post = vi.spyOn(axios, "post").mockResolvedValue(reply("hello"));
        const { askAi } = await loadAi({
            AI_PROVIDER: "openrouter",
            OPENROUTER_API_KEY: "or_test",
            OPENROUTER_MODEL: "main/model",
            OPENROUTER_FALLBACK_MODELS: "backup/model",
        });

        expect(await askAi([{ role: "user", content: "hi" }])).toBe("hello");

        const [url, body, options] = post.mock.calls[0];
        expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
        expect(body.models).toEqual(["main/model", "backup/model"]);
        expect(options.headers.Authorization).toBe("Bearer or_test");
    });
});

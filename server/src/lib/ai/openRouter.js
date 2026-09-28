import axios from "axios";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// messages: [{ role: "system" | "user" | "assistant", content: "..." }]
export const askAi = async (messages, { json = false } = {}) => {
    try {
        const response = await axios.post(
            OPENROUTER_URL,
            {
                model: process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5",
                messages,
                ...(json && { response_format: { type: "json_object" } }),
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 60000,
            }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error("Empty response from AI");
        }
        return json ? JSON.parse(content) : content;
    }
    catch (error) {
        console.error("Error in askAi:", error.response?.data || error.message);
        throw error;
    }
}

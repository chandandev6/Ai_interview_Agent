// fake AI: jo schema maanga, uska fixed jawab. Tests isse override kar sakte hai (mockRejectedValueOnce = AI down)
import {
    evaluationAiSchema,
    questionsAiSchema,
    reportAiSchema,
    resumeAiSchema,
} from "../../src/modules/interview/interview.ai-schemas.js";

export const FAKE_SCORES = { communication: 7, content: 6, technical: 8, confidence: 5 };

const replies = new Map([
    [
        resumeAiSchema,
        {
            skills: ["JavaScript", "React", "Node.js"],
            projects: [{ name: "InterviewIQ", tech: ["MERN"], summary: "AI mock interviews" }],
            experienceSummary: "2 years of full-stack work.",
        },
    ],
    [questionsAiSchema, { questions: [1, 2, 3, 4, 5].map((n) => ({ question: `Fake question ${n}?` })) }],
    [evaluationAiSchema, { scores: FAKE_SCORES, feedback: "Good answer, add an example." }],
    [
        reportAiSchema,
        {
            strengths: ["Clear explanations"],
            weaknesses: ["Few examples"],
            improvements: ["Use the STAR method"],
        },
    ],
]);

// asli askAiJson jaisa: schema se check karke saaf data lauta do
export const fakeAi = async (messages, schema) => {
    if (!replies.has(schema)) throw new Error("fakeAi: unknown schema");
    return schema.parse(replies.get(schema));
};

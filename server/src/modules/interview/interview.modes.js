// interview ke saare "settings" ek jagah — cost, questions, time, rubric badalna ho to sirf yaha
// naya mode = MODES me ek entry (prompts + scoring khud isse padh lete hai)

export const DIFFICULTIES = ["easy", "medium", "hard"];

// har interview me 5 questions, isi order me — difficulty CODE tay karta hai, AI sirf question likhta hai
export const QUESTION_PLAN = ["easy", "easy", "medium", "medium", "hard"];

// bolke jawab dene ka time (seconds)
export const TIME_LIMITS = { easy: 60, medium: 90, hard: 120 };

// dropdown ke options — free text nahi, taaki prompt me ajeeb cheezein na jaaye
export const EXPERIENCE_LEVELS = ["Fresher", "0-1 years", "1-3 years", "3-5 years", "5+ years"];

// starting = credit kat raha hai / AI questions bana raha hai (double-click isi status se pakadte hai)
export const INTERVIEW_STATUS = ["starting", "in_progress", "completed", "abandoned"];

// 4 scoring criteria — har answer ko har ek par 0-10 milta hai
export const CRITERIA = ["communication", "content", "technical", "confidence"];

export const MODES = {
    hr: {
        label: "HR interview",
        cost: 50,
        // AI ko batao kis type ke questions chahiye
        focus: "Behavioural and situational questions: teamwork, conflict, motivation, strengths and weaknesses, handling pressure, career goals, why this role. Encourage STAR-style answers (Situation, Task, Action, Result).",
        // har criterion ka matlab is mode me (evaluation prompt me jaata hai)
        rubric: {
            communication: "clear, well-structured, easy to follow",
            content: "relevant, specific real examples (STAR), answers what was asked",
            technical: "mentions relevant tools/skills or domain knowledge where it fits (not the main focus)",
            confidence: "sounds sure and positive, owns their actions, no excessive hedging",
        },
        // overall score = weighted average (code me calculate hota hai, AI nahi karta)
        weights: { communication: 0.35, content: 0.35, technical: 0.1, confidence: 0.2 },
    },
    technical: {
        label: "technical interview",
        cost: 50,
        focus: "Role-specific technical questions: core concepts, how things work under the hood, trade-offs, debugging, and design decisions. Questions must be answerable by speaking (no writing code).",
        rubric: {
            communication: "explains technical ideas clearly and in a logical order",
            content: "complete answer, covers the key points, gives an example where useful",
            technical: "technically correct, uses the right terms, understands trade-offs",
            confidence: "answers directly, does not guess wildly, admits limits honestly",
        },
        weights: { communication: 0.15, content: 0.3, technical: 0.45, confidence: 0.1 },
    },
    confidence: {
        label: "confidence-building interview",
        cost: 50,
        focus: "Common opening and self-presentation questions: introduce yourself, walk through your background, explain a project you are proud of, why should we hire you. The goal is fluent, confident speaking.",
        rubric: {
            communication: "fluent, well-paced, well-organised speech",
            content: "says something meaningful and specific about themselves",
            technical: "correctly describes their own skills and projects",
            confidence: "assertive and positive tone, no apologising or underselling",
        },
        weights: { communication: 0.35, content: 0.2, technical: 0.05, confidence: 0.4 },
    },
};

export const MODE_KEYS = Object.keys(MODES);

import { createSlice } from "@reduxjs/toolkit";

// chalu interview ka client-side state. status se Interviewpage tay karta hai kaunsi screen:
// "setup" → Step1 form, "in_progress" → Step2 live interview. Report apne URL (/report/:id) par khulti hai
const initialState = {
    interviewId: null,
    mode: null,
    avatar: "female",
    questions: [], // [{ question, difficulty, timeLimitSec }]
    currentIndex: 0, // questions.length tak pahunche = sab ho gaye → finish
    evaluations: [], // index wise { scores, feedback }
    // refresh ke baad wapas aaye — browser bina click ke awaaz nahi chalne deta, isliye "Continue" button dikhana hai
    resumed: false,
    status: "setup",
};

const interviewSlice = createSlice({
    name: "interview",
    initialState,
    reducers: {
        // POST /start ka jawab
        interviewStarted: (state, action) => {
            const { interviewId, mode, questions, avatar } = action.payload;
            return { ...initialState, interviewId, mode, questions, avatar, status: "in_progress" };
        },
        // refresh ke baad server (GET /:id) se wapas — pehla bina score wala question = jaha ruke the
        interviewRestored: (state, action) => {
            const { interview, avatar } = action.payload;
            const firstUnscored = interview.questions.findIndex((q) => !q.scores);
            return {
                ...initialState,
                interviewId: interview._id,
                mode: interview.mode,
                avatar: avatar || initialState.avatar,
                questions: interview.questions.map(({ question, difficulty, timeLimitSec }) => ({
                    question,
                    difficulty,
                    timeLimitSec,
                })),
                evaluations: interview.questions.map((q) =>
                    q.scores ? { scores: q.scores, feedback: q.feedback } : null,
                ),
                currentIndex: firstUnscored === -1 ? interview.questions.length : firstUnscored,
                resumed: true,
                status: "in_progress",
            };
        },
        resumeConfirmed: (state) => {
            state.resumed = false;
        },
        answerEvaluated: (state, action) => {
            const { questionIndex, scores, feedback } = action.payload;
            state.evaluations[questionIndex] = { scores, feedback };
            state.currentIndex = questionIndex + 1;
        },
        resetInterview: () => initialState,
    },
});

export const { interviewStarted, interviewRestored, resumeConfirmed, answerEvaluated, resetInterview } =
    interviewSlice.actions;

export default interviewSlice.reducer;

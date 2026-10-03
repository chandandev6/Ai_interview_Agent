// chalu interview ka id sessionStorage me — refresh ke baad wahi interview continue (50 credit barbaad na ho)
// storage band ho sakta hai (private mode) — tab bas resume nahi hoga, app nahi tootna chahiye
const KEY = "activeInterview";

export const saveActiveInterview = ({ interviewId, avatar }) => {
    try {
        sessionStorage.setItem(KEY, JSON.stringify({ interviewId, avatar }));
    } catch {
        /* storage nahi mila — koi baat nahi */
    }
};

export const getActiveInterview = () => {
    try {
        return JSON.parse(sessionStorage.getItem(KEY)) || null;
    } catch {
        return null;
    }
};

export const clearActiveInterview = () => {
    try {
        sessionStorage.removeItem(KEY);
    } catch {
        /* ignore */
    }
};

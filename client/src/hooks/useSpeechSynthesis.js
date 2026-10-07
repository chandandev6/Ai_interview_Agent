// AI interviewer ki awaaz — browser ka speechSynthesis (free, server par zero load)
import { useCallback, useEffect, useState } from "react";

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

// avatar ke hisaab se English voice dhundo (har OS/browser me naam alag hote hai — best effort)
const FEMALE = /female|zira|samantha|victoria|karen|susan|heera|veena|moira|tessa/i;
const MALE = /\bmale|david|daniel|alex|fred|ravi|rishi|george|mark/i;
// natural sounding voices (Chrome ki Google, Edge ki Microsoft Online/Natural, Mac ki Samantha/Daniel)
const NATURAL = /google|microsoft|natural|online|samantha|daniel|karen/i;

// har voice ko number do — sabse zyada wali jeete. Gender se zyada zaroori hai ki awaaz robotic na ho
const scoreVoice = (voice, hint) => {
    let score = 0;
    if (NATURAL.test(voice.name)) score += 4;
    if (voice.name.includes("+")) score -= 4; // Linux eSpeak variants ("+male8", "+grandpa") — bahut robotic
    if (hint.test(voice.name)) score += 2;
    if (/^en[-_](us|gb|in)/i.test(voice.lang)) score += 1;
    return score;
};

export const pickVoice = (voices, gender) => {
    const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
    const hint = gender === "male" ? MALE : FEMALE;
    let best = null;
    for (const voice of english) {
        if (!best || scoreVoice(voice, hint) > scoreVoice(best, hint)) best = voice;
    }
    return best;
};

// Chrome ki Google voices ~15 sec ke baad beech me chup ho jaati hai — isliye chhote tukde (sentence) me bolo
export const splitText = (text) =>
    text
        .split(/(?<=[.!?])\s+/) // sirf ". " par todo — "Node.js" jaise words na toote
        .flatMap((sentence) => (sentence.length > 200 ? sentence.split(/(?<=,)/) : [sentence]))
        .map((part) => part.trim())
        .filter(Boolean);

function useSpeechSynthesis(gender) {
    const [speaking, setSpeaking] = useState(false);

    useEffect(() => {
        if (!synth) return;
        synth.getVoices(); // Chrome voices baad me load karta hai — pehle hi trigger kar do
        return () => synth.cancel(); // page chhoda to bolna band
    }, []);

    // promise — bolna khatam (ya fail) hone par resolve. Fail par bhi interview rukna nahi chahiye
    const speak = useCallback(
        (text) =>
            new Promise((resolve) => {
                if (!synth) return resolve();
                synth.cancel();

                const parts = splitText(text);
                if (!parts.length) return resolve();
                const voice = pickVoice(synth.getVoices(), gender);

                let done = false;
                const finish = () => {
                    if (done) return;
                    done = true;
                    clearTimeout(safety);
                    setSpeaking(false);
                    resolve();
                };
                // Chrome kabhi kabhi "onend" fire hi nahi karta — atakne se bachne ke liye time limit
                const safety = setTimeout(finish, 3000 + text.length * 100);

                setSpeaking(true);
                // saare tukde browser ki queue me — ek ke baad ek bolega. Khatam = aakhri tukda khatam
                parts.forEach((part, i) => {
                    const utterance = new SpeechSynthesisUtterance(part);
                    if (voice) {
                        utterance.voice = voice;
                        utterance.lang = voice.lang;
                    }
                    utterance.rate = 0.95;
                    utterance.onerror = finish; // cancel() par bhi yahi aata hai
                    if (i === parts.length - 1) utterance.onend = finish;
                    synth.speak(utterance);
                });
            }),
        [gender],
    );

    const cancel = useCallback(() => {
        synth?.cancel(); // isse chal raha speak() bhi onerror se resolve ho jaata hai
        setSpeaking(false);
    }, []);

    return { supported: Boolean(synth), speaking, speak, cancel };
}

export default useSpeechSynthesis;

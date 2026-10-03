// AI interviewer ki awaaz — browser ka speechSynthesis (free, server par zero load)
import { useCallback, useEffect, useState } from "react";

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

// avatar ke hisaab se English voice dhundo (har OS/browser me naam alag hote hai — best effort)
const FEMALE = /female|zira|samantha|victoria|karen|susan|heera|veena|moira|tessa/i;
const MALE = /\bmale|david|daniel|alex|fred|ravi|rishi|george|mark/i;

const pickVoice = (gender) => {
    const english = synth.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("en"));
    const hint = gender === "male" ? MALE : FEMALE;
    return english.find((voice) => hint.test(voice.name)) || english[0] || null;
};

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

                const utterance = new SpeechSynthesisUtterance(text);
                const voice = pickVoice(gender);
                if (voice) utterance.voice = voice;
                utterance.rate = 0.95;

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
                utterance.onend = finish;
                utterance.onerror = finish;

                setSpeaking(true);
                synth.speak(utterance);
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

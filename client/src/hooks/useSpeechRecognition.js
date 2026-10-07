// user ka bola hua → text. Chrome/Edge me (webkitSpeechRecognition); Firefox me nahi → wahan type karna
import { useCallback, useEffect, useRef, useState } from "react";

// Brave me API dikhta hai par Google ki speech service block hai — mic "Listening" dikhata, likhta kuch nahi
const isBrave = typeof navigator !== "undefined" && Boolean(navigator.brave);
const SpeechRecognition =
    typeof window !== "undefined" && !isBrave ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// ye errors aaye to dobara try karne ka fayda nahi — user ko type karne bolo
const FATAL_ERRORS = {
    "not-allowed": "Microphone permission was denied. Allow mic access, or type your answer.",
    "service-not-allowed": "Microphone permission was denied. Allow mic access, or type your answer.",
    "audio-capture": "No microphone found. Please type your answer.",
    network: "Voice typing needs an internet connection. Please type your answer.",
};

// onFinalText(chunk) = ek pakka hua tukda (component use answer me jodta hai). interim = abhi bol raha hai (grey)
function useSpeechRecognition(onFinalText) {
    const [listening, setListening] = useState(false);
    const [interim, setInterim] = useState("");
    const [error, setError] = useState("");

    const recognitionRef = useRef(null);
    const wantListeningRef = useRef(false); // user ne band kiya ya browser ne khud? (Chrome chup rehne par khud band karta hai)
    const stopWaitersRef = useRef([]);
    const onFinalRef = useRef(onFinalText);

    useEffect(() => {
        onFinalRef.current = onFinalText; // hamesha latest callback — purana closure nahi
    });

    const start = useCallback(() => {
        if (!SpeechRecognition || wantListeningRef.current) return;
        setError("");
        wantListeningRef.current = true;

        const recognition = new SpeechRecognition();
        recognition.continuous = true; // ek sentence ke baad band mat ho
        recognition.interimResults = true; // bolte-bolte text dikhao
        recognition.lang = "en-IN"; // Indian English accent better samajhta hai

        recognition.onresult = (event) => {
            let interimText = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) onFinalRef.current(result[0].transcript.trim());
                else interimText += result[0].transcript;
            }
            setInterim(interimText);
        };

        recognition.onerror = (event) => {
            if (FATAL_ERRORS[event.error]) {
                wantListeningRef.current = false;
                setError(FATAL_ERRORS[event.error]);
            }
            // "no-speech" / "aborted" → onend khud restart kar dega
        };

        recognition.onend = () => {
            setInterim("");
            // Chrome ~kuch second chup rehne par khud band karta hai — user ne band nahi kiya to phir chalu
            if (wantListeningRef.current) {
                try {
                    recognition.start();
                    return;
                } catch {
                    wantListeningRef.current = false;
                }
            }
            setListening(false);
            stopWaitersRef.current.forEach((resolve) => resolve());
            stopWaitersRef.current = [];
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
            setListening(true);
        } catch {
            wantListeningRef.current = false;
        }
    }, []);

    // promise: band hone tak ruko — band hote waqt Chrome aakhri bola hua tukda bhejta hai, wo answer me aa jaaye
    const stop = useCallback(() => {
        const recognition = recognitionRef.current;
        if (!recognition || (!wantListeningRef.current && !listening)) return Promise.resolve();
        wantListeningRef.current = false;
        return new Promise((resolve) => {
            stopWaitersRef.current.push(resolve);
            setTimeout(resolve, 1500); // onend na aaye to bhi submit atke nahi
            recognition.stop();
        });
    }, [listening]);

    // page chhoda → mic band
    useEffect(
        () => () => {
            wantListeningRef.current = false;
            recognitionRef.current?.abort();
        },
        [],
    );

    return { supported: Boolean(SpeechRecognition), listening, interim, error, start, stop };
}

export default useSpeechRecognition;

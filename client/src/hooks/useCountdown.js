// har question ka countdown. Date.now() se — tab background me ho (browser timers dheeme karta hai) tab bhi sahi
import { useCallback, useEffect, useRef, useState } from "react";

function useCountdown(onExpire) {
    const [remaining, setRemaining] = useState(0);
    const [running, setRunning] = useState(false);
    const endAtRef = useRef(0);
    const startedAtRef = useRef(0);
    const onExpireRef = useRef(onExpire);

    useEffect(() => {
        onExpireRef.current = onExpire;
    });

    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => {
            const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
            setRemaining(left);
            if (left === 0) {
                setRunning(false);
                onExpireRef.current?.(); // time khatam → auto submit
            }
        }, 250);
        return () => clearInterval(id);
    }, [running]);

    const start = useCallback((seconds) => {
        startedAtRef.current = Date.now();
        endAtRef.current = Date.now() + seconds * 1000;
        setRemaining(seconds);
        setRunning(true);
    }, []);

    const stop = useCallback(() => setRunning(false), []);

    // kitne second lage (server ko bhejte hai)
    const elapsedSec = useCallback(() => Math.round((Date.now() - startedAtRef.current) / 1000), []);

    return { remaining, running, start, stop, elapsedSec };
}

export default useCountdown;

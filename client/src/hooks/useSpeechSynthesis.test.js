import { describe, expect, it } from "vitest";
import { pickVoice, splitText } from "./useSpeechSynthesis.js";

const voice = (name, lang = "en-US") => ({ name, lang });

describe("pickVoice", () => {
    it("prefers a natural voice over robotic eSpeak variants", () => {
        const voices = [
            voice("English (America)+female1"),
            voice("English (America, New York City)+male8"),
            voice("Google UK English Female", "en-GB"),
        ];
        expect(pickVoice(voices, "female").name).toBe("Google UK English Female");
    });

    it("uses the avatar gender among natural voices", () => {
        const voices = [voice("Google UK English Female", "en-GB"), voice("Google UK English Male", "en-GB")];
        expect(pickVoice(voices, "male").name).toBe("Google UK English Male");
        expect(pickVoice(voices, "female").name).toBe("Google UK English Female");
    });

    it("ignores non-English voices and returns null when none", () => {
        expect(pickVoice([voice("Google Deutsch", "de-DE")], "male")).toBeNull();
    });
});

describe("splitText", () => {
    it("splits into sentences", () => {
        expect(splitText("Question 1. What is Node.js? Explain hooks!")).toEqual([
            "Question 1.",
            "What is Node.js?",
            "Explain hooks!",
        ]);
    });

    it("splits a very long sentence at commas", () => {
        const long = `${"a".repeat(150)}, ${"b".repeat(100)}.`;
        expect(splitText(long)).toEqual([`${"a".repeat(150)},`, `${"b".repeat(100)}.`]);
    });

    it("returns nothing for empty text", () => {
        expect(splitText("   ")).toEqual([]);
    });
});

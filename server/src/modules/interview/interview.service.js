import { PDFParse } from "pdf-parse";
import AppError from "../../utils/AppError.js";
import { askAiJson } from "../../lib/ai/openRouter.js";
import { resumePrompt } from "./interview.prompts.js";
import { resumeAiSchema } from "./interview.ai-schemas.js";

const RESUME_MAX_PAGES = 5; // resume 1-2 page ka hota hai — 300 page ka PDF server ko busy na kare
const RESUME_MAX_CHARS = 12000; // AI ko itna hi bhejo — zyada text = zyada tokens = zyada paisa/time
const RESUME_MIN_CHARS = 50; // isse kam text = scanned photo wala PDF (text nahi, sirf image)

// PDF buffer (RAM me) → saaf text. mimetype client ka label hai, asli check yahi hai: padh paaye to hi PDF
const extractPdfText = async (buffer) => {
    const parser = new PDFParse({ data: buffer });
    try {
        const { text } = await parser.getText({ first: RESUME_MAX_PAGES });
        return text
            .replace(/[ \t]+/g, " ")
            .replace(/\n\s*\n+/g, "\n")
            .trim();
    } catch {
        throw new AppError(400, "Could not read this PDF. Please upload a valid PDF file.", "INVALID_PDF");
    } finally {
        await parser.destroy(); // pdf.js ki memory free karo
    }
};

// resume PDF → { skills, projects, experienceSummary }. PDF/text kahin save nahi hota
export const parseResume = async (buffer) => {
    const text = await extractPdfText(buffer);
    if (text.length < RESUME_MIN_CHARS) {
        throw new AppError(
            400,
            "No text found in this PDF. If it is a scanned image, please upload a text-based PDF.",
            "RESUME_NO_TEXT",
        );
    }

    try {
        return await askAiJson(resumePrompt(text.slice(0, RESUME_MAX_CHARS)), resumeAiSchema);
    } catch (error) {
        console.error("Resume parse AI failed:", error.message);
        throw new AppError(503, "AI is busy right now, please try again in a minute.", "AI_UNAVAILABLE");
    }
};

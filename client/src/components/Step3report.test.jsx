import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { downloadReportPdf } from "../utils/reportPdf.js";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import Step3report from "./Step3report.jsx";

vi.mock("../utils/reportPdf.js", () => ({ downloadReportPdf: vi.fn().mockResolvedValue(undefined) }));

const interview = {
    _id: "iv1",
    role: "Backend Developer",
    experience: "Fresher",
    mode: "technical",
    status: "completed",
    createdAt: "2026-10-05T10:00:00.000Z",
    completedAt: "2026-10-05T10:20:00.000Z",
    questions: [
        {
            question: "What is the event loop?",
            difficulty: "easy",
            timeLimitSec: 60,
            answer: "It runs callbacks.",
            timeTakenSec: 30,
            scores: { communication: 7, content: 6, technical: 8, confidence: 5 },
            feedback: "Add an example next time.",
        },
    ],
    report: {
        overallScore: 72,
        averages: { communication: 7, content: 6, technical: 8, confidence: 5 },
        strengths: ["Clear explanations"],
        weaknesses: ["Few examples"],
        improvements: ["Use the STAR method"],
    },
};

describe("Report", () => {
    it("shows the score, role, skills and AI feedback", () => {
        renderWithProviders(<Step3report interview={interview} />);

        expect(screen.getByText("72")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Backend Developer" })).toBeInTheDocument();
        expect(screen.getByText("Clear explanations")).toBeInTheDocument();
        expect(screen.getByText("Few examples")).toBeInTheDocument();
        expect(screen.getByText("Use the STAR method")).toBeInTheDocument();
        expect(screen.getByText("8/10")).toBeInTheDocument(); // technical average
    });

    it("Download PDF passes the interview to the PDF maker", async () => {
        const user = userEvent.setup();
        renderWithProviders(<Step3report interview={interview} />);

        await user.click(screen.getByRole("button", { name: /download pdf/i }));

        expect(downloadReportPdf).toHaveBeenCalledWith(interview);
    });
});

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { startInterview, uploadResume } from "../api/interview.api.js";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import Step1setup from "./Step1setup.jsx";

// asli server nahi — API functions fake. Hum sirf component ka behaviour check karte hai
vi.mock("../api/interview.api.js", () => ({ startInterview: vi.fn(), uploadResume: vi.fn() }));

const startButton = () => screen.getByRole("button", { name: /start interview/i });
const pdf = (name = "resume.pdf") => new File(["%PDF-1.4 fake"], name, { type: "application/pdf" });
const fileInput = () => document.querySelector('input[type="file"]');

beforeEach(() => vi.clearAllMocks());

describe("Setup page", () => {
    it("asks for a role before calling the server", async () => {
        const user = userEvent.setup();
        renderWithProviders(<Step1setup />);

        await user.click(startButton());

        expect(screen.getByText("Please enter the role you are preparing for.")).toBeInTheDocument();
        expect(startInterview).not.toHaveBeenCalled();
    });

    it("not enough credits → warning + Start disabled", () => {
        renderWithProviders(<Step1setup />, { credit: 20 });

        expect(screen.getByText(/You have 20 credits\. An interview needs 50\./)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /buy credits/i })).toBeInTheDocument();
        expect(startButton()).toBeDisabled();
    });

    it("starts the interview: sends the form, updates credits, remembers the interview for refresh", async () => {
        const user = userEvent.setup();
        startInterview.mockResolvedValue({
            data: { interviewId: "iv1", mode: "hr", credit: 450, questions: [{ question: "Q1?" }] },
        });
        const { store } = renderWithProviders(<Step1setup />);

        await user.type(screen.getByPlaceholderText(/frontend developer/i), "  Backend Developer  ");
        await user.click(screen.getByRole("button", { name: /hr/i }));
        await user.click(startButton());

        await waitFor(() => expect(store.getState().interview.status).toBe("in_progress"));
        const sent = startInterview.mock.calls[0][0];
        expect(sent).toMatchObject({ role: "Backend Developer", mode: "hr", experience: "Fresher" });
        expect(sent.requestId).toMatch(/^[0-9a-f-]{36}$/); // double-click safety id
        expect(store.getState().user.userData.credit).toBe(450);
        expect(JSON.parse(sessionStorage.getItem("activeInterview")).interviewId).toBe("iv1");
    });

    it("shows the server's error message (e.g. AI busy)", async () => {
        const user = userEvent.setup();
        startInterview.mockRejectedValue({
            response: { data: { message: "AI is busy right now, please try again in a minute." } },
        });
        renderWithProviders(<Step1setup />);

        await user.type(screen.getByPlaceholderText(/frontend developer/i), "Data Analyst");
        await user.click(startButton());

        expect(await screen.findByText("AI is busy right now, please try again in a minute.")).toBeInTheDocument();
    });

    it("resume: parsed skills are shown after upload", async () => {
        const user = userEvent.setup();
        uploadResume.mockResolvedValue({
            data: { resume: { skills: ["React", "Redis"], projects: [{ name: "ShopFast" }], experienceSummary: "" } },
        });
        renderWithProviders(<Step1setup />);

        await user.upload(fileInput(), pdf("my-cv.pdf"));

        expect(await screen.findByText("React")).toBeInTheDocument();
        expect(screen.getByText("Redis")).toBeInTheDocument();
        expect(screen.getByText(/ShopFast/)).toBeInTheDocument();
        expect(screen.getByText("my-cv.pdf")).toBeInTheDocument();
    });

    it("resume: a non-PDF file is refused without uploading", async () => {
        const user = userEvent.setup({ applyAccept: false }); // browser ka accept filter hata ke galat file daalo
        renderWithProviders(<Step1setup />);

        await user.upload(fileInput(), new File(["hello"], "notes.txt", { type: "text/plain" }));

        expect(screen.getByText("Please choose a PDF file.")).toBeInTheDocument();
        expect(uploadResume).not.toHaveBeenCalled();
    });
});

// har test se pehle: toBeInTheDocument() jaise DOM matchers, aur har test ke baad page saaf
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
    cleanup();
    sessionStorage.clear();
});

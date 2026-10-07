// backend ka URL. Local: .env me VITE_SERVER_URL=http://localhost:8000.
// Production (Vercel) me set mat karo → "" = same site ka /api, jise vercel.json Render tak bhejta hai (cookie first-party)
export const serverUrl = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.PROD ? "" : "http://localhost:8000");

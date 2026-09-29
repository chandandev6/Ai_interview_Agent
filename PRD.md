# PRD — AI Interview Agent (InterviewIQ.AI)

> Last updated: 2026-09-29 · Status: **Early MVP (≈25% built)**. Progress tracker is in **§0**; detailed steps are in **§10**.

---

## 0. 📊 Project Tracker  ← start here

> **This section is the single source of truth for progress.** Both of us update it:
> - When you start a step, set its status to 🟡 and fill in **Started**.
> - When a step's **✅ Done when** check passes (see §10), tick its boxes, set ✅, fill in **Done**, and add a line to the **Work Log** (§0.4).
> - Stuck? Set ⛔ and add a row to **Blockers & Decisions** (§0.5).
> - Claude updates this tracker at the end of every working session.
>
> **Status key:** ⬜ Todo · 🟡 In progress · ✅ Done · ⛔ Blocked · ⏭️ Skipped

### 0.1 Current focus
| | |
|---|---|
| **Now** | Step 4: Dev tooling — setup done; you: commit Step 3 → `npm run format` → commit |
| **Next** | Stage 2 → Step 5: Interview model + MODES + prompts |
| **Milestone** | 🎯 MVP (end of Stage 4): target **2026-10-22** |
| **Last updated** | 2026-09-30 |

### 0.2 Stage progress
| Stage | Steps | Done | Progress | Target date | Status |
|-------|-------|------|----------|-------------|--------|
| 0. Foundation | — | ✅ | `██████████` 100% | 2026-09-29 | ✅ |
| 1. Setup for growth | 1–4 (+2b) | 4/5 | `████████░░` 80% | 2026-10-02 | 🟡 |
| 2. Interview backend | 5–9 | 0/5 | `░░░░░░░░░░` 0% | 2026-10-09 | ⬜ |
| 3. Interview frontend | 10–14 | 0/5 | `░░░░░░░░░░` 0% | 2026-10-17 | ⬜ |
| 4. History & reports 🎯 MVP | 15–17 | 0/3 | `░░░░░░░░░░` 0% | 2026-10-22 | ⬜ |
| 5. Payments | 18–20 | 0/3 | `░░░░░░░░░░` 0% | 2026-10-28 | ⬜ |
| 6. Production & scale | 21–26 | 0/6 | `░░░░░░░░░░` 0% | 2026-11-06 | ⬜ |
| 7. Differentiators | 27–33 | 0/7 | `░░░░░░░░░░` 0% | after launch | ⬜ |
| **Total (Steps 1–26 + 2b)** | | **4/27** | `█░░░░░░░░░` 15% | | |

### 0.3 Step board
| # | Step | Area | Est. | Status | Started | Done | Notes |
|---|------|------|------|--------|---------|------|-------|
| 1 | Restructure server into feature modules | 🖥️ | 0.5d | ✅ | 2026-09-29 | 2026-09-29 | `server/src/` layout; API shape `{success,message,data}` |
| 2 | Security & validation (helmet, zod, rate limit) | 🖥️ | 0.5d | ✅ | 2026-09-30 | 2026-09-30 | env.js, validate.js, rateLimit.js, app.js order + trust proxy |
| 2b | Email/password login (bcrypt + email verification + forgot password) | 🖥️🎨 | 2d | ✅ | 2026-09-30 | 2026-09-30 | Committed `742ea00` (incl. forgot password, Gmail SMTP) |
| 3 | Client API layer + ProtectedRoute + lazy pages | 🎨 | 0.5d | ✅ | 2026-09-30 | 2026-09-30 | `src/api/`, interceptor, `loading`, ProtectedRoute, lazy pages; 10/10 headless-Chrome checks |
| 4 | Dev tooling (git, prettier, compress assets, README) | 🎨🖥️ | 0.5d | 🟡 | 2026-09-30 | | Setup done ✅ · ⏳ you: commit Step 3, then run `npm run format` + commit |
| 5 | Interview model + MODES + prompts | 🖥️ | 0.5d | ⬜ | | | |
| 6 | Resume upload & parsing | 🖥️ | 1d | ⬜ | | | |
| 7 | Start interview (atomic credits + questions) | 🖥️ | 1d | ⬜ | | | |
| 8 | Submit & evaluate answer | 🖥️ | 1d | ⬜ | | | |
| 9 | Finish + report + history API | 🖥️ | 1d | ⬜ | | | |
| 10 | Interview Redux slice + API | 🎨 | 0.5d | ⬜ | | | |
| 11 | Step 1: Setup screen | 🎨 | 1d | ⬜ | | | |
| 12 | Step 2: Live interview (voice, avatar, timer) | 🎨 | 2–3d | ⬜ | | | Core feature |
| 13 | Step 3: Report screen | 🎨 | 1d | ⬜ | | | |
| 14 | End-to-end polish | 🎨🖥️ | 1d | ⬜ | | | |
| 15 | History page | 🎨 | 1d | ⬜ | | | |
| 16 | Analytics (charts + stats API) | 🎨🖥️ | 1d | ⬜ | | | |
| 17 | Report page + PDF download | 🎨 | 1d | ⬜ | | | 🎯 MVP → deploy beta |
| 18 | Transaction ledger | 🖥️ | 0.5d | ⬜ | | | |
| 19 | Pricing + payment gateway + webhook | 🖥️🎨 | 2d | ⬜ | | | |
| 20 | Account page | 🎨 | 0.5d | ⬜ | | | |
| 21 | Logging & monitoring (pino, Sentry) | 🖥️ | 0.5d | ⬜ | | | |
| 22 | Redis (rate limit store, cache) | 🖥️ | 1d | ⬜ | | | |
| 23 | Background queue (BullMQ worker) | 🖥️ | 1–2d | ⬜ | | | |
| 24 | Tests + CI | 🖥️🎨 | 1–2d | ⬜ | | | |
| 25 | Deploy (Vercel + Render/Railway + Atlas) | 🚀 | 1d | ⬜ | | | |
| 26 | Load test to 1,000 req/s & tune | 📈 | 1d | ⬜ | | | |

### 0.4 Work log
Newest first. Format: `date · who · step · what changed`.

| Date | Who | Step | What |
|------|-----|------|------|
| 2026-09-30 | Claude | 4 | Root Prettier + scripts, server ESLint (3 fixes), WebP images (−88%), README. Verified: lint clean both apps, client build, all 8 WebP load in Chrome, Prettier dry run on a copy keeps lint/build/server working. Format run left to user so Step 3 commit stays readable. |
| 2026-09-30 | Claude | 3 | ✅ Step 3: `api/axios.js` (instance + 401 interceptor, ignores `/api/auth/*` and current-user), `auth.api.js`, `user.api.js`, `utils/getErrorMessage.js`; `userSlice.loading` + `finishLoading`; `ProtectedRoute` + `PageLoader`; lazy pages + lazy login popup; Navbar placeholders while loading; login returns to `from` page. Headless Chrome: redirect when logged out, back to /interview after login, survives refresh, no "0 credits" flash, logout works, no console errors. Interceptor's session-expired path not exercised yet (no protected API besides current-user). Not committed. |
| 2026-09-30 | You | 2b | ✅ Step 2b committed (`a7d62e8`, `742ea00`). |
| 2026-09-30 | Claude | 2b | Forgot password: model `passwordResetToken/Expires`, schemas, `requestPasswordReset` (background send → no slow-response leak) + `resetPassword`, 2 routes, `passwordResetEmail`, Auth.jsx "forgot" screen, `ResetPassword.jsx` + route. Verified 13 scenarios (unknown/known email same reply, bad/expired/reused link, short password, old pw rejected, Google-only user adds a password, unverified → verified). Found Gmail SMTP already configured; test sent 2 mails to @example.com (may bounce). Test users deleted. |
| 2026-09-30 | Claude | 2b | Task 5 (frontend): `Auth.jsx` rebuilt (Login/Sign up tabs, show-password, inline errors, loading, resend on EMAIL_NOT_VERIFIED, check-inbox screen, Google kept), new `VerifyEmail.jsx` + `/verify-email` route, App.jsx 401 race fix. Lint + build pass. Not yet clicked through in a browser. |
| 2026-09-30 | Claude | 2b | Tasks 2–4 (backend): `lib/mail/mailer.js` (SMTP or terminal fallback; SMTP required in production via env.js), `auth.emails.js`, schemas, service (register/verify/login/resend, sha256 link tokens, 24h expiry, dummy-hash timing guard, Google login wipes unverified password), `AppError` gets `code`, routes + `authLimiter` 10/15min. Verified 15 scenarios incl. takeover attempt and timing (316 vs 312 ms); test users deleted. |
| 2026-09-30 | Claude | 2b | Task 1: installed `bcryptjs`, `nodemailer`; User model gets `password` (select:false), `isVerified`, `verificationToken(+Expires)`, lowercase/trim email. DB has 3 existing Google users without `isVerified` (handled in Task 3). |
| 2026-09-30 | Claude | 2 | ✅ Step 2 done. Task 4: `app.js` wired — trust proxy (prod only) → helmet → cors → compression → /health → globalLimiter → json → cookies → routes. Verified: helmet headers + no `X-Powered-By`, gzip on >1 kB, bad body → 400, request 101 → 429 with CORS header, /health still 200 while limited. |
| 2026-09-30 | Claude | 2 | Task 3: `middlewares/rateLimit.js` (`globalLimiter` 100/min per IP, `aiLimiter` 10/min per user, our `{success,message}` shape, `RateLimit` headers). Verified on a throwaway app: request 101 → 429; user A's 11th AI call → 429 while user B on the same IP → 200. Not wired into app.js yet. |
| 2026-09-30 | Claude | 2 | Task 2: `middlewares/validate.js` + `modules/auth/auth.schema.js`; `POST /api/auth/google` validated. Verified: `{}`, no body, number, empty string → 400 with clear message; broken JSON → 400; extra fields stripped. |
| 2026-09-30 | Claude | 2 | Task 1: `config/env.js` (zod) — server exits with a list of bad vars; switched app.js, cookie, db, token, isAuth, firebaseAdmin, openRouter, server.js to `env.X`. Verified all endpoints + JWT sign/verify. |
| 2026-09-30 | Claude | 0 | Health check: server syntax/boot/Mongo/endpoints OK, client build OK. Fixed 4 lint errors (unused props in Step1/2/3 stubs → TODOs). Added missing env vars to `server/.env` and `client/.env`. Added `CLAUDE.md` with working rules (explain first, wait for go). Installed `helmet compression express-rate-limit zod` for Step 2. |
| 2026-09-29 | Claude | 1 | Server moved to `server/src/` (app.js, server.js with graceful shutdown, `modules/auth`, `modules/user` with controller/service/routes, `AppError`, `sendSuccess`, `notFound` + `errorHandler`). All responses are now `{ success, message, data }`; client updated to read `result.data.data.user`. Verified: health, current-user (valid, missing cookie), Google token checks, logout, 404, bad JSON → 400, SIGTERM shutdown. |
| 2026-09-29 | Claude | 0 | Merged the step plan into this PRD as a tracker (§0, §10) |
| 2026-09-29 | Claude | 0 | Wrote the PRD and 26-step execution plan |
| 2026-09-29 | Claude | 0 | Full code review: fixed the auth takeover (Firebase ID token verified on the server), the `openRouter.service.js` syntax error, broken Interviewpage imports, missing `/interview` route, isAuth 500→401, DB-before-listen, port 8000, circular import, multer, cookies/CORS from env, Home/Navbar UI typos, lint errors. Added `.env.example` files. |

### 0.5 Blockers & decisions
| Date | Type | Item | Status / Decision |
|------|------|------|-------------------|
| 2026-09-29 | Action | Add the new env vars (`CLIENT_URL`, `FIREBASE_PROJECT_ID`, `OPENROUTER_MODEL`, `NODE_ENV`, `VITE_SERVER_URL`) | ✅ Done 2026-09-30 |
| 2026-09-29 | Action | Rotate `JWT_SECRET` and API keys if `.env` was ever pushed to GitHub | ⬜ Owner: you |
| 2026-09-29 | Action | Run `npm audit` in client and server | ⬜ |
| 2026-09-29 | Decision | Speech-to-text and text-to-speech run in the browser (Web Speech API) to keep server load and cost near zero | ✅ Decided |
| 2026-09-29 | Decision | Resume PDFs are parsed in memory; only the text is stored | ✅ Decided |
| 2026-09-29 | Decision | No `asyncHandler` wrapper: Express 5 forwards rejected promises to the error middleware, so controllers just `throw new AppError(...)` | ✅ Decided |
| 2026-09-29 | Action | Commit the foundation + Step 1 work | ✅ Done 2026-09-30 |
| 2026-09-30 | Decision | Email/password login uses our own bcrypt + MongoDB (not Firebase email auth), with email verification required | ✅ Decided (learning bcrypt) |
| 2026-09-30 | Action | Create a Gmail App Password and add `SMTP_*` vars to `server/.env` | ✅ Done — Gmail accepted test mails |
| 2026-09-30 | Known gap | Password reset does not log out other devices (JWT is stateless, 7-day cookie stays valid). Fix later with a `tokenVersion` on the user checked in `isAuth` | ⏭️ Later (Stage 6) |
| — | Open | Payment gateway: Razorpay (India) or Stripe? | ❓ Decide before Step 19 |
| — | Open | Default AI model and cost per interview (credits pricing) | ❓ Decide before Step 7 |

---

## 1. Product Overview

**What it is:** A web platform where a candidate signs in, uploads a resume (PDF), picks a role / experience level / interview mode, and is interviewed **live by an AI interviewer** (avatar video + voice). Every answer is evaluated, and at the end the user gets a scored report (downloadable as PDF) and can track progress over time. Interviews cost **credits**.

**Target users:** Students and job seekers preparing for HR and technical interviews.

**Core value:** Realistic, resume-aware, timed mock interviews with instant, structured feedback.

---

## 2. Feature List (derived from the frontend) & Current Status

| # | Feature | Where it's promised | Status |
|---|---------|---------------------|--------|
| F1 | Google Sign-In (Firebase popup → server JWT cookie) | Auth page / Auth modal | ✅ Done (fixed & secured, see §4) |
| F2 | Session restore (`/api/user/current-user`) | `App.jsx` | ✅ Done |
| F3 | Logout | Navbar | ✅ Done |
| F4 | Credits wallet (500 free on signup, shown in Navbar) | Navbar, Home "Credit Based" | 🟡 Balance shown; **no deduction, no purchase** |
| F5 | Landing page (hero, 3 steps, capabilities, modes) | `Home.jsx` | ✅ Done |
| F6 | **Step 1 – Setup:** role, experience, mode, resume upload | `Step1setup.jsx` | ❌ Empty stub |
| F7 | **Resume-based questions** (projects/skills from PDF) | Home "Resume Based Interview" | ❌ Not started (multer ready, no parser) |
| F8 | **Step 2 – Live interview:** AI avatar video (`male-ai.mp4`, `female-ai.mp4`), voice question (TTS), voice answer (STT), timer per question | `Step2interview.jsx`, Home "Voice Recognition", "Timer Based" | ❌ Empty stub |
| F9 | Dynamic follow-up questions based on previous answers | Home Step 2 | ❌ Not started |
| F10 | **AI answer evaluation** — communication, content, technical accuracy, confidence | Home "AI Answer Evaluation" | ❌ Not started (`askAi` service now implemented) |
| F11 | Interview modes: HR, Technical, Confidence | Home "Multiple Interview Modes" | ❌ Not started |
| F12 | **Step 3 – Report:** scores, strengths, weaknesses, improvements | `Step3report.jsx`, `Interviewreport.jsx` | ❌ Empty stub |
| F13 | Downloadable PDF report | Home | ❌ Not started |
| F14 | Interview history + analytics (progress over time) | `/history` link in Home & Navbar | ❌ Page/route doesn't exist |
| F15 | Pricing / buy credits (payment gateway) | `/pricing` link in Navbar | ❌ Page/route doesn't exist |

**Where you are right now:** see the **§0 Project Tracker**. Foundation (auth, landing UI, AI service) is done, and the next milestone is the end-to-end interview loop (F6 → F8 → F10 → F12).

---

## 3. Tech Stack (current)

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 8, Tailwind v4, Redux Toolkit, React Router 7, `motion`, react-icons, Firebase Auth (client) |
| Backend | Node 22, Express 5 (ESM), Mongoose 9, JWT (httpOnly cookie), multer, axios, firebase-admin |
| AI | OpenRouter (`services/openRouter.service.js`, model configurable via `OPENROUTER_MODEL`) |
| DB | MongoDB |

```
Ai_interview_Agent/
├── client/src/
│   ├── config/server.js        # serverUrl (VITE_SERVER_URL)
│   ├── pages/                  # Home, Auth, Interviewpage, Interviewreport
│   ├── components/             # Navbar, Footer, Authmodel, Step1/2/3
│   ├── redux/                  # store.js, userSlice.js
│   └── utils/firebase.js
└── server/src/
    ├── app.js                  # express app: CORS, routes, /health, 404 + error handler
    ├── server.js               # DB connect, listen, graceful shutdown
    ├── config/                 # db, token, cookie, firebaseAdmin
    ├── middlewares/            # isAuth, upload (multer), errorHandler
    ├── utils/                  # AppError, response (sendSuccess)
    ├── lib/ai/openRouter.js    # askAi()
    └── modules/
        ├── auth/               # auth.routes / controller / service
        └── user/               # user.routes / controller / service / model
```

---

## 4. Code Review — Errors Found & Fixed (this review)

### 🔴 Critical
| Issue | Fix |
|-------|-----|
| **Account takeover:** `/api/auth/google` trusted `name`/`email` from the request body. Anyone could `curl` any email and get a valid session for that user. | Client now sends Firebase **ID token**; server verifies it with `firebase-admin` (`config/firebaseAdmin.js`) and reads email from the verified token (also requires `email_verified`). |
| `services/openRouter.service.js` had a **syntax error** (unclosed braces) — server would crash as soon as it's imported. | Implemented `askAi(messages, { json })` with timeout, JSON mode, error propagation. |

### 🟠 Bugs
| Issue | Fix |
|-------|-----|
| `Interviewpage.jsx` imported `./Step1setup` etc. from `pages/` — files live in `components/` (would fail when route added). | Fixed import paths. |
| `/interview` route missing — "Get Started" led to a blank page. | Added `/interview` and `/report/:id` routes. |
| `isAuth` returned **500** for expired/invalid JWT. | Now returns **401**. |
| `genToken` swallowed errors → cookie could be set to `undefined`. | Throws; made synchronous. |
| DB connected *after* `listen`, and failure was only logged → server ran without DB. | Connect first, `process.exit(1)` on failure. |
| Default server port `6000` is blocked by browsers (unsafe port) and didn't match client (`8000`). | Default `8000`. |
| Circular import: `Navbar`/`Auth` imported `serverUrl` from `App.jsx` (breaks Vite fast-refresh). | Moved to `client/src/config/server.js`, env-driven. |
| `Auth.jsx` logged the full Firebase response (tokens) to console; standalone `/auth` page never redirected after login. | Removed log; redirects to `/` when not in modal. |
| Navbar `userData?.name.slice` crashes if name missing; "Interview History" button did nothing. | Optional chaining; button navigates to `/history`. |
| multer wrote to a non-existent `public/` dir, accepted any file type. | `memoryStorage` + PDF-only filter + central error handler (400 on bad upload). |
| Token was returned in JSON body (defeats httpOnly cookie). | Removed from body; password stripped from user. |
| Cookie `secure:false` / CORS origin hard-coded. | `config/cookie.js` (secure + `sameSite:none` in production), CORS from `CLIENT_URL`. |

### 🟡 Cleanup
- Tailwind typos in `Home.jsx`: `bg-white-border`, stray `f`, `tracking-order`, `hover shadow-2xl`; hero badge text was outside its pill. Fixed.
- Conflicting classes in Navbar (`shadow-lg … shadow-sm`, `rounded … rounded-xl`). Fixed.
- `redux/sotre.js` → `redux/store.js`. Removed unused `React` imports (11 ESLint errors). `useEffect` deps fixed.
- `nodemon` moved to devDependencies. Added `.env.example` for client and server.
- Remaining lint: 4 "unused prop" errors in the empty Step1/2/3 stubs — disappear once implemented.

### ⚠️ Action required by you
1. **Rotate secrets if this code was ever pushed with `.env`** (`.gitignore` covers it, but verify on GitHub). Use a long random `JWT_SECRET`.
2. Add new env vars from `server/.env.example` (`CLIENT_URL`, `FIREBASE_PROJECT_ID`, `OPENROUTER_MODEL`, `NODE_ENV`) and `VITE_SERVER_URL` in client.
3. Run `npm audit` in `server/` and `client/`.

---

## 5. Data Model (target)

```js
User {                       // exists
  name, email (unique), password?, credit (default 500),
  plan?: "free" | "pro",     // future
  timestamps
}

Interview {                  // NEW — Phase 1
  userId: ObjectId (index),
  role: String, experience: String,          // "Frontend Developer", "0-1 yrs"
  mode: "hr" | "technical" | "confidence",
  resumeText: String,                        // parsed from PDF (don't store the file)
  status: "in_progress" | "completed" | "abandoned",
  questions: [{
    question, difficulty: "easy"|"medium"|"hard", timeLimitSec,
    answer, answeredInSec,
    scores: { communication, content, technical, confidence },  // 0-10
    feedback
  }],
  report: { overallScore, strengths[], weaknesses[], improvements[] },
  creditsUsed: Number,
  timestamps
}
// indexes: { userId: 1, createdAt: -1 }, { status: 1 }

Transaction {                // Phase 3 — credits ledger
  userId, type: "signup_bonus"|"interview"|"purchase"|"refund",
  amount (+/-), balanceAfter, paymentId?, timestamps
}
```

---

## 6. API Spec (target)

| Method | Route | Auth | Purpose | Status |
|--------|-------|------|---------|--------|
| POST | `/api/auth/google` | – | `{ idToken }` → set cookie | ✅ |
| POST | `/api/auth/logout` | – | clear cookie | ✅ |
| GET | `/api/user/current-user` | ✅ | current user | ✅ |
| GET | `/health` | – | liveness probe | ✅ |
| POST | `/api/interview/resume` | ✅ | multipart PDF → `{ resumeText, skills, projects }` | ❌ |
| POST | `/api/interview/start` | ✅ | `{ role, experience, mode, resumeText }` → deduct credits, generate questions, return `{ interviewId, questions }` | ❌ |
| POST | `/api/interview/:id/answer` | ✅ | `{ questionIndex, answer, timeTaken }` → score + feedback (+ optional follow-up) | ❌ |
| POST | `/api/interview/:id/finish` | ✅ | build final report | ❌ |
| GET | `/api/interview/history` | ✅ | paginated list (`?page=&limit=`) | ❌ |
| GET | `/api/interview/:id` | ✅ | full report (owner only) | ❌ |
| GET | `/api/payment/plans` · POST `/api/payment/order` · POST `/api/payment/verify` | ✅ | buy credits (Razorpay/Stripe) | ❌ |

---

## 7. Interview Flow (Phase 1 design)

```
Step1setup ──► POST /resume (optional) ──► POST /start
   │                                         │ atomic credit deduction:
   │                                         │ User.findOneAndUpdate({_id, credit:{$gte:COST}}, {$inc:{credit:-COST}})
   │                                         │ askAi(system prompt: role+exp+mode+resume) → 5 questions JSON
   ▼                                         ▼
Step2interview: for each question
   - play AI avatar video (male/female-ai.mp4) + speak question (browser speechSynthesis)
   - listen with browser SpeechRecognition (Web Speech API) → live transcript, editable
   - countdown timer (timeLimitSec by difficulty), auto-submit at 0
   - POST /:id/answer → scores + feedback
   ▼
POST /:id/finish → report  ──► Step3report (charts + "Download PDF") ──► saved in history
```

**Why speech in the browser:** STT/TTS on the client costs nothing and adds zero server load, which is key for the scale target. Upgrade path: Whisper / Deepgram streaming for browsers without `SpeechRecognition` (Firefox).

**AI prompt rules:** always request strict JSON (`askAi(messages, { json: true })`), validate shape with `zod`, retry once on invalid JSON, refund credits if generation fails.

---

## 8. Non-Functional Requirements — Scaling to 1,000 req/s

### 8.1 Honest capacity math
- **Plain API requests** (auth, history, reports) at 1,000 req/s: easy. One Node process handles roughly 2–5k simple req/s. With 4–8 instances behind a load balancer there's plenty of headroom.
- **LLM calls are the real bottleneck.** Each takes 2–15 s and costs money. 1,000 LLM calls per second is about 60k per minute. No provider rate limit or budget allows that, and you don't need it. **1,000 req/s of total traffic means roughly 10–50 concurrent LLM calls**, because users spend most of their time speaking and not calling the API.
- Design goal: **stateless API + async/queued AI work + caching + rate limits.**

### 8.2 Target architecture
```
            ┌──────────── CDN (Vercel/Cloudflare) ── React static build
Browser ────┤
            └── Load Balancer (Nginx / ALB / Render / Railway)
                    │
          ┌─────────┼─────────┐
       API #1    API #2 ...  API #N     (stateless Express, PM2 cluster / containers)
          │         │          │
          ├── Redis ──────────────── rate-limit store, cache, BullMQ queues, sessions blacklist
          ├── MongoDB Atlas (replica set, indexes, pool 50/instance)
          └── BullMQ workers ─────── resume parsing, report generation, PDF, emails
                    │
                 OpenRouter (with retries, timeouts, fallback model)
```

### 8.3 Checklist
| Area | What to do | Phase |
|------|-----------|-------|
| Stateless | JWT cookie (done), no local disk (done: multer memory), no in-memory sessions | ✅ |
| Process | `pm2 start index.js -i max` or Docker replicas; graceful shutdown on SIGTERM | 2 |
| Security headers / compression | `helmet`, `compression` | 1 |
| Rate limiting | `express-rate-limit` + `rate-limit-redis`: global 100 req/min/IP; AI endpoints 10/min/user | 1–2 |
| Input validation | `zod` schemas on every body | 1 |
| DB | Indexes (§5), `.lean()` on reads, projection, pagination, `maxPoolSize` (done) | 1 |
| Atomic credits | `findOneAndUpdate` with `$gte` guard + ledger; refund on AI failure | 1 |
| Queue | BullMQ for resume parsing (CPU) and final report; client polls or uses SSE | 2 |
| AI resilience | timeout (done, 60s), retry with backoff, fallback model, per-user concurrency = 1, streaming for question text | 2 |
| Cache | Redis: `current-user` (60 s), history pages, role question banks | 2 |
| Observability | `pino` logs, request IDs, Sentry, `/health` (done) + `/ready` (DB ping), Prometheus metrics | 2 |
| Load test | `autocannon` / `k6`: 1,000 rps on `/health`, `/current-user`, `/history`; p95 < 200 ms | 2 |
| Frontend | Code-split routes (`React.lazy`), bundle is 540 kB now; compress the PNGs (≈150–250 kB each) and MP4s, serve from CDN | 1 |

---

## 9. Extensibility — how to add features easily

Adopt a **feature-module** structure on the server so each new feature is one folder and one line in `index.js`:

```
server/src/
├── app.js                 # express app (no listen) → testable with supertest
├── server.js              # connect DB, listen, graceful shutdown
├── config/                # env (validated with zod), db, redis, firebase
├── middlewares/           # isAuth, validate(schema), rateLimit, errorHandler, upload
├── lib/                   # ai/ (askAi, prompts/), pdf/, logger
└── modules/
    ├── auth/        { auth.routes.js, auth.controller.js, auth.service.js, auth.schema.js }
    ├── user/
    ├── interview/   { routes, controller, service, model, schema, prompts.js }
    ├── payment/
    └── report/
```

Rules:
1. **Controller** handles only HTTP (req/res). **Service** holds business logic (callable from routes, workers, and tests). **Model** is the DB layer.
2. Throw `AppError(status, message)`. One error middleware formats all responses as `{ success, message, data }`.
3. Every route gets a `zod` schema through `validate()`.
4. Prompts live in `modules/*/prompts.js`, versioned, and never inline in controllers.
5. Interview modes are a **strategy map**, so adding a mode is config and not code:
   ```js
   export const MODES = {
     hr:         { cost: 50,  questions: 5, systemPrompt: HR_PROMPT,   rubric: [...] },
     technical:  { cost: 100, questions: 6, systemPrompt: TECH_PROMPT, rubric: [...] },
     confidence: { cost: 50,  questions: 5, systemPrompt: CONF_PROMPT, rubric: [...] },
   };
   ```
6. Client: one `api/` layer (axios instance with `baseURL` + `withCredentials` + 401 interceptor → logout). Use one Redux slice per domain (`user`, `interview`). Protect pages with a `<ProtectedRoute>` wrapper instead of repeating `if (!userData)` in each page.
7. Tests: `vitest` + `supertest` (server), `vitest` + Testing Library (client). CI on GitHub Actions: lint → test → build.

---

## 10. Execution Plan — detailed steps

> Work top to bottom. Don't start a step until the previous step's **✅ Done when** checks pass. Tick `[x]` here, then update the board in §0.3.
> **Legend:** 🖥️ server · 🎨 client · ⏱️ rough effort (1 day ≈ 4–6 focused hours)

### Stage 0 — Foundation ✅ (done)
- [x] Google login (Firebase ID token verified on the server), logout, session restore
- [x] User model with 500 free credits
- [x] Landing page, Navbar, Footer, Auth modal
- [x] `askAi()` OpenRouter service, multer (PDF-only, memory), central error handler, `/health`
- [x] Code review fixes (see §4)

---

### Stage 1 — Setup for growth (do this first; cheap now, painful later)

#### Step 1 🖥️ Restructure the server into feature modules ⏱️ 0.5 day
- [x] Split `index.js` into `src/app.js` (the Express app) and `src/server.js` (DB connect + listen + graceful shutdown on `SIGTERM`)
- [x] Move code into `src/modules/auth/`, `src/modules/user/` (routes, controller, service)
- [x] Add `src/utils/AppError.js`, so controllers don't need `try/catch` everywhere (`asyncHandler` not needed: Express 5 catches async errors)
- [x] All responses use the shape `{ success, message, data }`
- [x] Update `package.json` scripts to `src/server.js`

**✅ Done when:** login, logout and current-user still work, and `/health` returns ok.

#### Step 2 🖥️ Security & validation basics ⏱️ 0.5 day
- [x] `npm i helmet compression express-rate-limit zod`
- [x] `src/config/env.js`: validate all env vars with zod at startup, so the server crashes early if one is missing (all files now use `env.X`, no `process.env` outside env.js)
- [x] `middlewares/validate.js`: `validate(schema)` for body, params and query (first use: `modules/auth/auth.schema.js` → `POST /api/auth/google`)
- [x] `middlewares/rateLimit.js`: global rate limit of 100 req/min per IP, plus an `aiLimiter` of 10 req/min per user (used from Step 6 on) — `globalLimiter` keyed by IP, `aiLimiter` keyed by `req.userId` (IP fallback); in-memory store until Step 22
- [x] Wire `helmet` + `compression` + global limiter into `app.js` (order: trust proxy → helmet → cors → compression → /health → limiter → json → cookies → routes)

**✅ Done when:** a bad request body returns 400 with a clear message, and the 101st request in a minute returns 429.

#### Step 2b 🖥️🎨 Email/password login ⏱️ 1.5 days  _(added 2026-09-30, not in the original plan)_
Own passwords with bcrypt (not Firebase email auth) — chosen to learn hashing. Google login keeps working; same JWT cookie after login.
- [x] `npm i bcryptjs nodemailer`; User model: `password` (select:false), `isVerified`, `verificationToken` (sha256 hash) + `verificationTokenExpires`, email lowercase
- [x] `lib/mail/mailer.js`: nodemailer over SMTP (Gmail App Password); if SMTP not set, print the link in the terminal (dev)
- [x] `auth.schema.js` + `auth.service.js`: register, verifyEmail, login, resendVerification; Google login sets `isVerified` and wipes an unverified password (pre-account-takeover fix)
- [x] Controller + routes (`/register`, `/verify-email`, `/login`, `/resend-verification`) + strict `authLimiter` on login/register
- [x] Frontend: new `Auth.jsx` (Login / Sign up tabs, show password, errors, loading, Google button) + `/verify-email` page (`pages/VerifyEmail.jsx`); App.jsx no longer dispatches null on 401 (race fix)
- [x] Forgot password: `POST /forgot-password` (same response for any email, email sent in background) + `POST /reset-password` (1h link, one-time, sets `isVerified`, logs in); "Forgot password?" screen in `Auth.jsx` + `pages/ResetPassword.jsx`. Google-only users can use it to add a password.
- [x] You: Gmail SMTP in `server/.env` (confirmed working 2026-09-30)
- [x] You: tested in the browser and committed (`a7d62e8`, `742ea00`)

**✅ Done when:** sign up → link (email or terminal) → click → logged in; wrong password → "Invalid email or password"; unverified login → "verify your email" + resend; forgot password → email → new password → logged in, old password rejected; Google login still works.

#### Step 3 🎨 Client API layer + protected routes ⏱️ 0.5 day
- [x] `src/api/axios.js`: an axios instance with `baseURL: serverUrl`, `withCredentials: true`, and an interceptor that clears the user on 401
- [x] `src/api/auth.api.js`, `user.api.js`: move the calls out of the components (+ `utils/getErrorMessage.js`)
- [x] Add `loading` to `userSlice` so the app doesn't flash "logged out" while fetching the current user
- [x] `components/ProtectedRoute.jsx`: wrap `/interview`, `/report/:id` (`/history` when the page exists); login sends you back to the page you came from
- [x] Lazy-load pages with `React.lazy` + `Suspense` (fixes the 540 kB bundle warning) — main 540 → 445 kB, login popup + Firebase (107 kB) load only when opened

**✅ Done when:** opening `/interview` while logged out shows the login modal or redirects, and after refresh a logged-in user stays on the page.

#### Step 4 🎨🖥️ Dev tooling ⏱️ 0.5 day
- [x] `git init` at `Ai_interview_Agent/` (if not already a repo) and first commit; confirm `.env` is **not** committed (repo existed; `.env` is gitignored)
- [x] Prettier config shared by client and server; ESLint for the server — root `package.json` (`format`, `format:check`, `lint`, `check`), `.prettierrc.json` (4 spaces, 120 cols, JSON 2 spaces), `.prettierignore` (md, lockfiles, dist); `server/eslint.config.js` (fixed 3 unused-var errors)
- [ ] You: run `npm run format` once (after committing Step 3) — dry run on a copy: 43 files, lint/build/server boot all fine
- [x] Compress images in `client/src/assets` (use WebP, target < 60 kB each) and videos (target < 2 MB each) — 8 PNGs 1283 kB → 157 kB WebP (11–28 kB each, PSNR 40–45 dB); videos already 1.1/1.3 MB; `MM.png` unused, left as is
- [x] Root `README.md` with the run instructions (copy §12) — plus features, stack, structure, env tables, scripts, API list

**✅ Done when:** `npm run lint` passes in both apps and the repo is committed.

---

### Stage 2 — Interview backend

#### Step 5 🖥️ Interview model + mode config ⏱️ 0.5 day
- [ ] `modules/interview/interview.model.js` (schema in §5) with index `{ userId: 1, createdAt: -1 }`
- [ ] `modules/interview/modes.js`: the `MODES` map (`hr`, `technical`, `confidence`), each with `cost`, `questionCount`, time limits by difficulty, and a rubric
- [ ] `modules/interview/prompts.js`: system prompts for question generation, per-answer evaluation, and the final report. Every prompt asks for **strict JSON**.
- [ ] Zod schemas for the AI outputs (questions, evaluation, report)

**✅ Done when:** the model imports cleanly and the prompts are reviewed.

#### Step 6 🖥️ Resume upload & parsing ⏱️ 1 day
- [ ] `npm i pdf-parse`
- [ ] `POST /api/interview/resume` with `isAuth`, `aiLimiter`, `upload.single("resume")`
- [ ] Extract the text (reject if empty, e.g. a scanned image PDF) and trim it to about 12k characters
- [ ] `askAi` returns `{ skills[], projects[{name, tech[], summary}], experienceSummary }`
- [ ] Return the parsed data. Don't store the PDF file.

**✅ Done when:** uploading your own resume returns sensible skills and projects, a `.docx` returns 400, and a 6 MB file returns 400.

#### Step 7 🖥️ Start interview (credits + questions) ⏱️ 1 day
- [ ] `POST /api/interview/start` with body `{ role, experience, mode, resume? }`
- [ ] **Atomic credit deduction:** `User.findOneAndUpdate({ _id, credit: { $gte: cost } }, { $inc: { credit: -cost } }, { new: true })`. If this returns `null`, respond 402 "Not enough credits".
- [ ] Generate N questions with `askAi(..., { json: true })`, validate with zod, and retry once
- [ ] If the AI fails, **refund the credits** and return 503
- [ ] Save the Interview with `status: "in_progress"` and return `{ interviewId, questions (text, difficulty, timeLimitSec only), credit }`

**✅ Done when:** credits drop by `cost`, a user with 0 credits gets 402, and forcing an AI error (bad API key) refunds the credits.

#### Step 8 🖥️ Submit & evaluate an answer ⏱️ 1 day
- [ ] `POST /api/interview/:id/answer` with body `{ questionIndex, answer, timeTakenSec }`
- [ ] Owner check (`interview.userId === req.userId`), status must be `in_progress`, and the question must not already be answered
- [ ] Empty or skipped answer: score 0 without calling the AI
- [ ] `askAi` returns `{ scores: { communication, content, technical, confidence }, feedback }` (0–10)
- [ ] Save into `questions[i]`, then return the evaluation

**✅ Done when:** answers are scored, another user's interview returns 404, and submitting twice returns 409.

#### Step 9 🖥️ Finish interview + report, get by id ⏱️ 1 day
- [ ] `POST /api/interview/:id/finish`: compute the average scores in code (not the AI), then `askAi` for strengths, weaknesses and improvements. Set `status: "completed"`.
- [ ] `GET /api/interview/:id`: the full report, owner only
- [ ] `GET /api/interview/history?page=1&limit=10`: `.lean()`, projection (no questions array), sorted newest first
- [ ] Test the whole flow with Postman or Thunder Client and save the collection in the repo (`/docs/api.postman.json`)

**✅ Done when:** the full flow resume → start → 5 answers → finish works through Postman.

---

### Stage 3 — Interview frontend

#### Step 10 🎨 Interview slice + API ⏱️ 0.5 day
- [ ] `api/interview.api.js` with all Stage 2 endpoints
- [ ] `redux/interviewSlice.js` holding `{ interviewId, questions, currentIndex, evaluations, report, status }`
- [ ] Keep the Navbar credit count updated from the `/start` response

#### Step 11 🎨 Step 1: Setup screen ⏱️ 1 day
- [ ] Role input with suggestions (Frontend, Backend, Full Stack, Data Analyst, …)
- [ ] Experience select (Fresher, 1–3 yrs, 3–5 yrs, 5+ yrs)
- [ ] Mode cards using `HR.png`, `tech.png`, `confi.png`, each showing its credit cost
- [ ] PDF drag-and-drop zone that shows parsed skills and projects as chips (optional but recommended)
- [ ] Avatar choice (male/female) and a "Start Interview" button that shows the cost, with a loading state while questions generate

**✅ Done when:** clicking Start creates an interview and moves to Step 2.

#### Step 12 🎨 Step 2: Live interview (the core feature) ⏱️ 2–3 days
- [ ] `hooks/useSpeechSynthesis.js`: speak the question with `window.speechSynthesis`
- [ ] `hooks/useSpeechRecognition.js`: `webkitSpeechRecognition`, continuous, interim results, and restart on end. Fall back to a text box if the browser doesn't support it (Firefox).
- [ ] `hooks/useTimer.js`: countdown per question that auto-submits at 0
- [ ] Layout: avatar video (`male-ai.mp4` / `female-ai.mp4`, playing while the AI speaks) on one side, and the question, live transcript (editable), timer and mic button on the other
- [ ] Submit, then show a short feedback toast and move to the next question. Add a progress bar (Q 2/5).
- [ ] Ask "Are you sure?" on leave or refresh (`beforeunload`)
- [ ] After the last question, call `/finish` and go to Step 3

**✅ Done when:** you can complete a full interview by voice in Chrome, and by typing in Firefox.

#### Step 13 🎨 Step 3: Report screen ⏱️ 1 day
- [ ] Overall score ring, 4 skill bars, strengths/weaknesses/improvements lists
- [ ] Per-question accordion: question, your answer, score, feedback
- [ ] Buttons: "Download PDF" (Step 17), "New Interview", "View History"

#### Step 14 🎨🖥️ End-to-end polish ⏱️ 1 day
- [ ] Loading skeletons, error toasts (`react-hot-toast`), empty states
- [ ] Mobile responsive check for Home, Setup, Interview and Report
- [ ] Handle credits running out (link to `/pricing`) and AI failures (retry button)

**✅ Done when:** a friend can use it with no help and with no console errors.

---

### Stage 4 — History & reports 🎯 MVP

#### Step 15 🎨 History page (`/history`) ⏱️ 1 day
- [ ] Paginated list of cards (role, mode, date, score, status) linking to `/report/:id`
- [ ] Filter by mode and a "Load more" button

#### Step 16 🎨 Analytics ⏱️ 1 day
- [ ] `npm i recharts`: a line chart of the overall score over time and average skill scores
- [ ] Server endpoint `GET /api/interview/stats` using a MongoDB aggregation (average by mode, trend)

#### Step 17 🎨 Report page + PDF download ⏱️ 1 day
- [ ] `/report/:id`: reuse the Step 3 report component (`Interviewreport.jsx`)
- [ ] PDF via `jspdf` + `jspdf-autotable` on the client (no server load)

**✅ Done when (🎯 MVP):** a new user can sign up, take 2 interviews, see history and trend, and download a PDF. **Deploy a beta (Step 25) now** and collect feedback.

---

### Stage 5 — Payments

#### Step 18 🖥️ Transaction ledger ⏱️ 0.5 day
- [ ] `Transaction` model (§5); write a row on signup bonus, interview start, refund and purchase
- [ ] Use a MongoDB transaction/session for the credit update plus the ledger insert

#### Step 19 🖥️🎨 Pricing + Razorpay/Stripe ⏱️ 2 days
- [ ] Plans kept in config (e.g. 500 credits for ₹99, 1500 for ₹249)
- [ ] `POST /api/payment/order`, then checkout, then `POST /api/payment/verify` (verify the signature on the server), then add credits
- [ ] **Webhook** handler that is idempotent (a unique `paymentId` index) so a payment is never credited twice
- [ ] `/pricing` page with plan cards, connected to the "Buy more credits" button

#### Step 20 🎨 Account page ⏱️ 0.5 day
- [ ] Credit balance, transaction history, logout

**✅ Done when:** a test-mode payment adds credits exactly once, even if the webhook fires twice.

---

### Stage 6 — Production & scale (target: 1,000 req/s)

#### Step 21 🖥️ Logging & monitoring ⏱️ 0.5 day
- [ ] `pino` + `pino-http` with a request ID; remove `console.log`
- [ ] Sentry on client and server
- [ ] `/ready` endpoint that pings the DB (and Redis)

#### Step 22 🖥️ Redis ⏱️ 1 day
- [ ] `ioredis`; move the rate-limit store to Redis (`rate-limit-redis`) so limits work across instances
- [ ] Cache `current-user` (60 s) and `stats`; clear the cache on credit change

#### Step 23 🖥️ Background queue ⏱️ 1–2 days
- [ ] `bullmq` with a separate `src/worker.js` process
- [ ] Move resume parsing and final report generation to jobs; the client polls `GET /api/jobs/:id` or uses SSE
- [ ] AI retries with exponential backoff and a fallback model (`OPENROUTER_FALLBACK_MODEL`)
- [ ] Per-user concurrency: 1 active AI job at a time

#### Step 24 🖥️🎨 Tests + CI ⏱️ 1–2 days
- [ ] Server: `vitest` + `supertest` + `mongodb-memory-server`, covering auth, the credits race (10 parallel `/start` calls with credits for only 1), and the answer ownership check
- [ ] Client: `vitest` + Testing Library for Setup and Report
- [ ] GitHub Actions: lint → test → build on every push

#### Step 25 🚀 Deploy ⏱️ 1 day
- [ ] Client on Vercel or Netlify (set `VITE_SERVER_URL`)
- [ ] Server on Render, Railway or a VPS with Docker + PM2 (`-i max`); worker as a separate service
- [ ] MongoDB Atlas and Redis (Upstash or Redis Cloud)
- [ ] `NODE_ENV=production`, set `CLIENT_URL` to the real domain, use HTTPS, and add the domain to Firebase **Authorized domains**
- [ ] Custom domain; cookies work cross-site (`sameSite: none; secure` is already handled in `config/cookie.js`)

#### Step 26 📈 Load test & tune ⏱️ 1 day
- [ ] `k6` or `autocannon` at 1,000 req/s mixed across `/health`, `/api/user/current-user` and `/api/interview/history`
- [ ] Targets: p95 < 200 ms, errors < 1%
- [ ] Tune: instance count, Mongo `maxPoolSize`, missing indexes (check `explain()`), and cache hit rate
- [ ] AI endpoints: test at about 50 concurrent to confirm the queue handles the backlog without timeouts

**✅ Done when:** the load test report is saved in `/docs/loadtest.md` and meets the targets.

---

### Stage 7 — Differentiators (after launch, pick by user feedback)
- [ ] **27.** Adaptive follow-up questions (the next question depends on the last answer's score)
- [ ] **28.** Webcam confidence analysis in the browser with MediaPipe (eye contact, face presence), feeding the "confidence" score
- [ ] **29.** Coding round with an in-browser editor (Monaco) and AI code review
- [ ] **30.** Company-specific question packs (Google, TCS, Amazon style)
- [ ] **31.** Real-time streaming voice interviewer (better STT/TTS, interruption handling)
- [ ] **32.** Admin dashboard for users, interviews per day, AI cost per interview, and revenue
- [ ] **33.** Email report and weekly progress email

---

### Working rules (every step)
1. **One step = one git branch = one commit or PR.** Message format: `step-7: start interview with atomic credits`.
2. New server feature: create `modules/<feature>/` with routes, controller, service, model, schema, then add one line in `app.js`.
3. Every new route gets `isAuth` (if private), `validate(schema)`, and a rate limiter (if it calls the AI).
4. Never trust the client for credits, scores or user identity; compute them on the server.
5. Update the §0 tracker after every step, and the §2 feature table when a feature ships.

---

## 11. Success Metrics
- Interview completion rate > 70%
- p95 API latency < 200 ms (non-AI), AI question generation < 6 s
- AI cost per interview tracked and below revenue per credit
- 1,000 req/s sustained in load test with < 1% errors

## 12. How to Run
```bash
# server
cd server && cp .env.example .env   # fill values
npm install && npm run dev          # http://localhost:8000/health

# client
cd client && cp .env.example .env   # fill VITE_FIREBASE_API_KEY
npm install && npm run dev          # http://localhost:5173
```

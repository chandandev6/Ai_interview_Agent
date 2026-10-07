# InterviewIQ.AI — AI Interview Agent

Practise job interviews with an AI interviewer. Sign in, upload your resume, pick a role, experience level and mode (HR / Technical / Confidence), answer questions by voice, and get a scored report with feedback.

> 🚧 Work in progress. Login and the app foundation are done; the interview flow is being built. Progress is tracked in [`PRD.md`](PRD.md) (§0 Project Tracker).

## ✨ Features

| Status | Feature |
|---|---|
| ✅ | Google sign-in (Firebase) |
| ✅ | Email + password sign-up with email verification, login, forgot/reset password |
| ✅ | Session in an httpOnly JWT cookie (7 days), protected pages |
| ✅ | Security basics: helmet, rate limiting, request validation (zod), env validation |
| 🚧 | Resume upload and resume-based questions |
| 🚧 | Live interview: AI avatar, voice questions and answers, timer |
| 🚧 | AI answer evaluation, report + PDF, interview history and analytics |
| 🚧 | Credits and payments |

## 🧱 Tech stack

| Part | Tech |
|---|---|
| Frontend (`client/`) | React 19, Vite, Tailwind CSS 4, Redux Toolkit, React Router 7, Firebase Auth, motion |
| Backend (`server/`) | Node.js 22, Express 5 (ES modules), MongoDB + Mongoose, JWT, bcryptjs, zod, nodemailer |
| AI | OpenRouter (default model `anthropic/claude-haiku-4.5`) |

## 📁 Project structure

```
Ai_interview_Agent/
├── client/                 React app
│   └── src/
│       ├── api/            all server calls (axios instance + one file per feature)
│       ├── components/     Navbar, ProtectedRoute, interview steps...
│       ├── pages/          one file per route (lazy-loaded)
│       ├── redux/          store + userSlice (userData, loading)
│       └── utils/          firebase, getErrorMessage
├── server/                 Express API
│   └── src/
│       ├── app.js          middleware order + routes
│       ├── server.js       DB connect, listen, graceful shutdown
│       ├── config/         env (zod-validated), db, cookie, token, firebaseAdmin
│       ├── middlewares/    isAuth, validate, rateLimit, errorHandler, upload
│       ├── modules/        one folder per feature: routes → controller → service → model (+ schema)
│       ├── lib/            ai (OpenRouter), mail (nodemailer)
│       └── utils/          AppError, sendSuccess
├── PRD.md                  product plan + progress tracker
└── CLAUDE.md               working rules and code conventions
```

## 🚀 Run locally

**Needs:** Node.js 22+, a MongoDB database (local or [Atlas](https://www.mongodb.com/atlas)), a Firebase project with Google sign-in enabled, Docker (for Redis).

```bash
# 1. install
npm install                      # root: Prettier
npm install --prefix server
npm install --prefix client

# 2. env files — copy and fill in (see tables below)
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. Redis (rate limits + cache + job queue) on port 6380
docker compose up -d

# 4. run (three terminals)
cd server && npm run dev         # http://localhost:8000/ready → {"status":"ready","db":"ok","redis":"ok"}
cd server && npm run dev:worker  # background AI jobs (resume parsing, final report) + cleanup every minute
cd client && npm run dev         # http://localhost:5173
```

### `server/.env`

| Variable | Required | Example / notes |
|---|---|---|
| `PORT` | no | `8000` |
| `NODE_ENV` | no | `development` or `production` |
| `MONGODB_URL` | **yes** | `mongodb+srv://...` |
| `MONGO_POOL_SIZE` | no | `50` |
| `JWT_SECRET` | **yes** | long random string, 16+ characters |
| `CLIENT_URL` | no | `http://localhost:5173` (comma-separated for several) |
| `FIREBASE_PROJECT_ID` | **yes** | your Firebase project id |
| `OPENROUTER_API_KEY` | **yes** | from openrouter.ai |
| `OPENROUTER_MODEL` | no | `anthropic/claude-haiku-4.5` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | production only | Gmail: `smtp.gmail.com`, `587`, your Gmail, a 16-char [App Password](https://myaccount.google.com/apppasswords). Empty in dev → emails are printed in the server terminal |
| `MAIL_FROM` | no | `InterviewIQ <you@gmail.com>` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | no | Razorpay Test Mode keys. Empty → buying credits is disabled |
| `REDIS_URL` | **yes** | `redis://localhost:6380` (from `docker compose up -d`). Rate limits, cache and the job queue |
| `WORKER_CONCURRENCY` | no | `10` — AI jobs one worker runs at the same time |
| `LOG_LEVEL` | no | `info` (`debug` for more detail) |
| `SENTRY_DSN` | no | error monitoring. Empty → off |

The server checks these at startup and refuses to start with a clear list if something is missing or wrong.

### `client/.env`

| Variable | Notes |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_SERVER_URL` | `http://localhost:8000` |
| `VITE_SENTRY_DSN` | optional error monitoring. Empty → off |

## 🛠️ Scripts

| Where | Command | Does |
|---|---|---|
| root | `npm run format` | Format all code with Prettier |
| root | `npm run format:check` | Check formatting without changing files |
| root | `npm run lint` | ESLint for client and server |
| root | `npm run check` | Format check + lint + client build — run before committing |
| root | `npm test` | All server + client tests (needs Redis: `docker compose up -d`) |
| server / client | `npm test` / `npm run test:watch` | Run tests once / re-run on every save |
| server | `npm run dev` | Start API with auto-restart (nodemon) |
| server | `npm run dev:worker` / `npm run worker` | Start the background job worker (dev with auto-restart / production) |
| client | `npm run dev` / `npm run build` | Vite dev server / production build |

## 🧪 Tests & CI

- **Server** (`server/test/`, Vitest + Supertest): real HTTP requests against the Express app, a temporary in-memory MongoDB (`mongodb-memory-server`, replica set for transactions) and Redis DB 1 (your dev data in DB 0 is never touched). The AI and email are faked, so tests are fast, free and repeatable. Covers auth, the credits race (10 parallel starts with credits for 1), ownership, the job queue (incl. retries), payments (signatures, idempotent webhook, verify/webhook race) and the cleanup job.
- **Client** (`client/src/**/*.test.jsx`, Vitest + Testing Library + jsdom): Setup page, Report page, job polling.
- **CI** (`.github/workflows/ci.yml`): on every push / pull request GitHub runs format check → lint → server tests (with a Redis service) → client tests → build.

## 🔌 API (so far)

All responses look like `{ success, message, data }`. Errors may include a `code` (e.g. `EMAIL_NOT_VERIFIED`).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/google` | – | Log in with a Firebase ID token |
| POST | `/api/auth/register` | – | Create an email/password account (sends verification link) |
| POST | `/api/auth/verify-email` | – | Verify email from the link → logged in |
| POST | `/api/auth/resend-verification` | – | Send a new verification link |
| POST | `/api/auth/login` | – | Email + password login |
| POST | `/api/auth/forgot-password` | – | Email a password-reset link |
| POST | `/api/auth/reset-password` | – | Set a new password from the link → logged in |
| POST | `/api/auth/logout` | – | Clear the login cookie |
| GET | `/api/user/current-user` | cookie | The logged-in user |
| GET | `/health` | – | Uptime check |

Login, register, resend and password routes are limited to 10 attempts per 15 minutes per IP; everything else to 100 requests per minute.

# Prompt2App — Product Requirements Document

| Field | Value |
|---|---|
| **Status** | v2.0 Live |
| **Owner** | Tanish Poddar |
| **Live URL** | [https://prompt2app.tanisheesh.in](https://prompt2app.tanisheesh.in) |
| **One-liner** | Turn plain English or spoken prompts into working, multi-version, zero-dependency HTML5 web apps in seconds — powered by Groq LPU. |

---

## 1. Problem & Quantified Impact

Building a quick interactive web tool — a SaaS revenue dashboard, Kanban board, budget tracker, synthesizer, or REST client — normally requires scaffolding a project, running package installs, configuring a bundler, and writing hundreds of lines of HTML, CSS, and JavaScript. Existing tools either stop at static mockups (Figma) or require manual coding (CodePen). Even Prompt2App v1 (blocking Firebase Genkit + Gemini Server Actions) forced users behind a 10–20 second loading spinner before any output appeared and failed voice dictation outside Chrome.

| Dimension | Before (Manual / v1 Baseline) | After (v2 Target) |
|---|---|---|
| Prototype turnaround | 30–60 min manual setup (or 10–20s blocking Genkit action) | Streaming preview + `1.5–5s` typical build at `~450–1,000 tok/s` |
| Follow-up iteration | Edit full file by hand or restart prompt from scratch | Immutable `v1`–`v15` snapshots with multi-turn refinement |
| Browser voice input | Chrome-only `SpeechRecognition` (fails on Firefox/Safari) | Universal `MediaRecorder` + `whisper-large-v3-turbo` (`300 B–15 MB`) |
| Hosting & DB overhead | Auth + server DB setup required for history | Stateless API routes + client `localStorage` (`25` projects max) |

---

## 2. Goals (v2)

1. Stream complete, runnable single-file HTML5 applications in real time via Groq LPU (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`) with live `tok/s` telemetry and 3-model automatic fallback.
2. Provide a clean product landing page (`/`) and full-screen Studio workbench (`/studio`) with `Preview`, `Code`, and `Split` modes across Desktop (`100%`), Tablet (`768px`), and Mobile (`390px`) frames.
3. Persist conversational refinements as immutable version snapshots (`v1`, `v2`, `v3`...) in browser `localStorage` with zero-login friction and quota-safe pruning.
4. Provide 1-click prompt expansion (`POST /api/enhance`) and cross-browser voice dictation (`POST /api/transcribe`).
5. Run generated apps safely inside an opaque-origin `<iframe srcDoc>` with an injected `localStorage`/`sessionStorage` polyfill and 1-click **Fix error** AI recovery.
6. Export standalone `.html` files that run offline in any modern browser without Node.js or build tooling.

---

## 3. Non-Goals (Explicit Scope Cuts)

- **User accounts or server database** — History lives in browser `localStorage` (`prompt2app_projects_v2`). Revisit only if cross-device workspace sync or shareable permalinks become a primary user demand.
- **Public community prompt gallery** — User prompts and generated apps remain private on the user's device; avoids content moderation and storage overhead.
- **Multi-file React / Vite zip export** — A single `.html` artifact opens anywhere with a double-click and no `npm install`. Revisit only when generated apps exceed single-file maintainability limits.
- **Hosted user-app subdomains** — Prompt2App compiles and exports portable artifacts rather than operating a multi-tenant static hosting platform (which brings abuse/phishing moderation scope).

---

## 4. Users & Personas

**Primary:** Developers, indie hackers, and students turning plain-English or spoken specs into working dashboards, calculators, audio tools, and interactive utilities in seconds.

**Secondary:** Product designers and founders prototyping live flows; technical interviewers evaluating LLM streaming, cross-origin sandboxing, and Next.js App Router architecture.

---

## 5. User Stories & Acceptance Criteria

### Story 1 — Streaming App Generation & Cancellation
*As a developer, I want to describe an app in plain English and watch it stream live so that I have an interactive prototype within seconds.*
- **Given** a prompt between `2` and `12,000` characters, **When** I submit via `/` or `/studio`, **Then** `POST /api/generate` streams sanitized HTML tokens via `ReadableStream` (`200`, `X-Model-Used` header) and mounts the completed app in `<iframe srcDoc>`.
- **Given** an in-flight stream, **When** I click **Stop**, **Then** `AbortController` cancels the client `fetch` and `req.signal` aborts the upstream Groq completion (`499`) without corrupting prior saved versions.
- **Given** an invalid or oversized payload (`< 2` chars or `> 12,000` chars), **When** posted to `/api/generate`, **Then** Zod rejects the request before calling Groq (`400`).

### Story 2 — Prompt Enhancement & Voice Dictation
*As a user with a rough or spoken idea, I want voice input and 1-click enhancement so that I can build detailed apps from any browser.*
- **Given** a draft prompt (`2–4,000` chars), **When** I click **Enhance**, **Then** `POST /api/enhance` returns an expanded 2–4 sentence implementation specification (`200 { enhancedPrompt }`).
- **Given** microphone permission in Chrome, Firefox, or Safari, **When** I record (`audio/webm` or `audio/mp4` fallback) and click stop, **Then** `POST /api/transcribe` validates file size (`300 B–15 MB`) and returns Whisper text (`200 { text }`), stopping hardware mic tracks immediately on completion or unmount.

### Story 3 — Multi-Turn Versioning, Sandboxed Preview & Export
*As a builder iterating on a prototype, I want immutable snapshots, responsive frames, runtime error recovery, and standalone export.*
- **Given** an active app version (`v1`), **When** I submit a follow-up edit, **Then** `currentCode` (`<= 250,000` chars) is refined into `v2` and persisted in `localStorage` (`prompt2app_projects_v2`).
- **Given** generated JS calling `localStorage` or throwing an exception inside the sandboxed iframe, **When** rendered in `PreviewCanvas`, **Then** `injectSandboxRuntime()` supplies an in-memory `Storage` shim (preventing `SecurityError`) and surfaces runtime errors via `postMessage` with a 1-click **Fix error** action.
- **Given** a generated app, **When** I click **Download HTML**, **Then** the un-shimmed clean HTML downloads as `<slug>-v<n>.html` for offline execution.

---

## 6. Functional Requirements

### 6.1 Prompt Composer & Starter Blueprints
- Multi-line composer supports `Enter` submit and `Shift+Enter` newline, model picker (`GPT-OSS 120B`, `Qwen 3.8 27B`, `GPT-OSS 20B`), **Enhance**, and **Voice** controls.
- `STARTER_TEMPLATES` (`src/lib/prompts.ts`) provides 6 curated blueprints (`Kanban Board`, `Analytics Dashboard`, `Pomodoro Focus Timer`, `Expense Tracker`, `16-Step Drum Machine`, `REST API Tester`).

### 6.2 Voice Dictation
- `VoiceRecorderButton` detects `MediaRecorder.isTypeSupported` in order: `audio/webm;codecs=opus` → `audio/webm` → `audio/mp4` (Safari).
- Displays elapsed recording timer (`0:00` with `tabular-nums`), cleans up `MediaStream` tracks and timers on unmount, and ignores tiny recordings (`< 400 B` client / `< 300 B` server).

### 6.3 Streaming AI Generation & Refinement
- `POST /api/generate` switches automatically between `SYSTEM_PROMPT_GENERATE` (initial build) and `SYSTEM_PROMPT_REFINE` (when non-empty `currentCode` is supplied).
- Server iterates candidate models starting with requested model followed by `FALLBACK_MODELS` (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`).
- `cleanHtmlOutput()` removes `<think>...</think>` blocks and outer code fences while preserving inline JavaScript backtick template literals.

### 6.4 Studio Workbench & Local Persistence
- Unified `WorkspaceToolbar` supports `Preview` / `Code` / `Split` tabs, `Desktop` (`100%`) / `Tablet` (`768px`) / `Mobile` (`390px`) frames, reload, open in new tab (`Blob` URL), fullscreen (`Esc` exit), copy, and `.html` download.
- `src/lib/storage.ts` caps persistence at `25` projects and `15` versions per project under `prompt2app_projects_v2`, pruning oldest projects/versions automatically when browser `localStorage` approaches its ~5 MB limit.

---

## 7. Edge-Case & Failure Behavior Matrix

| Scenario | Expected System Behavior | User Feedback / Status |
|---|---|---|
| Prompt `< 2` or `> 12,000` chars | Rejected at Zod boundary in `/api/generate` | `400 { error }` toast |
| Refinement `currentCode > 250,000` chars | Rejected at Zod boundary before calling Groq | `400 { error }` toast |
| Audio `< 300 B` or `> 15 MB` | Rejected in `/api/transcribe` before Groq Whisper | `400` or `413` toast |
| Primary Groq model throttled / fails | Server cascades through `FALLBACK_MODELS`; returns `502` if all fail | `X-Model-Used` reflects fallback or `502` toast |
| User clicks **Stop** or navigates away | `AbortController` cancels `fetch`; `req.signal` aborts Groq stream | `499`; previous snapshot untouched |
| Generated app touches `localStorage` | Injected shim provides in-memory `Storage` inside opaque origin | App works in preview; real `localStorage` after download |
| Generated app throws runtime JS error | `window.onerror` / `unhandledrejection` posts `PROMPT2APP_RUNTIME_ERROR` | Banner with **Fix error** button |
| Browser `localStorage` 5 MB quota full | `saveProjects()` drops oldest projects, then falls back to last 2 versions | No unhandled `QuotaExceededError` |
| Mobile viewport (`390px`) | Toolbar switches to 2-row compact controls + bottom quick-edit bar + version drawer | Zero horizontal overflow |

---

## 8. Non-Functional Requirements & Budgets

- **Latency:** Node.js streaming Route Handlers capped at `maxDuration = 60` (`/api/generate`) and `30` (`/api/enhance`, `/api/transcribe`); Groq SDK client timeout at `55_000ms` with `maxRetries: 2`.
- **Security:** `GROQ_API_KEY` read strictly server-side; preview `<iframe>` omits `allow-same-origin` and `allow-top-navigation`; `vercel.json` sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Strict-Transport-Security`, and `Permissions-Policy: camera=(), microphone=(self), geolocation=()`.
- **Cost & Spend Ceiling:** Hard input caps (`12,000` prompt / `250,000` refine context / `15 MB` audio), `max_completion_tokens` caps (`32,768` / `16,384` / `600`), and upstream stream abort on client disconnect.
- **Reliability:** Multi-model fallback loop on `/api/generate` and `/api/enhance`, quota-safe `localStorage` pruning, and self-healing iframe runtime bridge.
- **Accessibility:** Semantic `<button>` / `<main>` / `<aside>` landmarks, `aria-label` controls, `Esc` fullscreen exit, and WCAG AA obsidian contrast (`#0C0C0E` / `#F5F5F5`).

---

## 9. Unit Economics & Quota Budget

| Resource | Configured Limit / Plan Ceiling | Estimated Usage per 1,000 Actions | Scaling Note |
|---|---|---|---|
| Compute (Vercel Hobby) | `60s` max function duration · `100 GB-hrs/mo` | `< 1 GB-hr` (streaming I/O wait) | Docs-only builds ignored via deploy config |
| Groq LLM Generation | Up to `32,768` output tokens/req (model-dependent) | ~3–6M output tokens across mixed 20B/120B builds | Auto-fallback across 3 models absorbs per-model RPM spikes |
| Groq Prompt Enhancer | `600` max output tokens/req | <= `600K` output tokens | Defaults to `openai/gpt-oss-20b` first |
| Groq Whisper Voice | `15 MB` max upload/req | ~`100–300 MB` audio (typical 5–15s clips) | Client enforces >= `400 B` before upload |
| Persistence (Browser) | `~5 MB` per-origin `localStorage` | `0` server bytes (`25` projects × `15` versions client-side) | Quota-pruned automatically in `storage.ts` |

---

## 10. Success Metrics & Instrumentation

| Metric | Target | How Measured |
|---|---|---|
| End-to-end build duration | `1.5–5s` typical single-file build | Measured in Studio `performance.now()` (`durationMs`, `tokensPerSec`) |
| Sandbox storage compatibility | `0` uncaught `SecurityError` crashes on `localStorage` | Verified via `injectSandboxRuntime()` memory shim |
| Type & build integrity | `0` TypeScript or production build errors | `pnpm run typecheck && pnpm run build` in GitHub Actions CI |
| Static security hygiene | `0` high/critical CodeQL or Gitleaks findings | `codeql.yml`, `secret-scan.yml`, `dependency-review.yml` |

---

## 11. Risks, Assumptions & Open Questions

| Item | Impact | Mitigation / Status |
|---|---|---|
| **Unauthenticated public API cost / rate-limit spikes** | High | Hard Zod bounds + 3-model fallback + client abort propagation; per-IP Upstash rate limiting planned next |
| **Groq model deprecation or quota exhaustion** | Medium | Centralized `GROQ_MODELS` catalog and `FALLBACK_MODELS` list in `src/lib/groq.ts` |
| **Offline CDN dependency inside exported HTML** | Low | Exported HTML references Tailwind/Chart.js/Lucide CDNs (runs offline once browser-cached; future inline bundle option open) |
| **Large single-file component files (`> 300` lines)** | Low | Existing `page.tsx`, `studio/page.tsx`, and `workspace-toolbar.tsx` work cleanly today; refactor incrementally into smaller modules |

---

## 12. v2+ Candidates

- **Incremental AST/DOM diff patching** — Apply targeted updates on large (`> 800` line) apps in under 1 second without re-streaming the full document.
- **Per-IP sliding-window rate limiting** — Protect `/api/generate`, `/api/enhance`, and `/api/transcribe` with Upstash Ratelimit.
- **Automated unit & Playwright E2E/a11y suite** — Cover `cleanHtmlOutput`, `injectSandboxRuntime`, `storage.ts`, API route validation, and viewport/accessibility regressions in CI.
- **Image-to-App vision input & read-only share links** — Optional wireframe screenshot input and content-addressed read-only snapshots.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>

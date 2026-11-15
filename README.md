<p align="center">
  <img src="docs/logo.svg" width="64" height="64" alt="Prompt2App logo">
</p>

<h1 align="center">Prompt2App</h1>

<p align="center">
  <strong>Turn plain English or spoken prompts into working, multi-version, zero-dependency HTML5 web apps in seconds — powered by Groq LPU.</strong>
</p>

<p align="center">
  <a href="https://prompt2app.tanisheesh.in">
    <img src="https://img.shields.io/badge/live_demo-visit-10B981?style=flat-square" alt="Live Demo">
  </a>
  <a href="https://github.com/tanisheesh/Prompt2App/actions/workflows/ci.yml">
    <img src="https://github.com/tanisheesh/Prompt2App/actions/workflows/ci.yml/badge.svg" alt="CI">
  </a>
  <a href="https://github.com/tanisheesh/Prompt2App/actions/workflows/codeql.yml">
    <img src="https://github.com/tanisheesh/Prompt2App/actions/workflows/codeql.yml/badge.svg" alt="CodeQL">
  </a>
  <img src="https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Groq-F55036?style=flat-square" alt="Groq">
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">
  <img src="https://img.shields.io/badge/license-GPL--3.0-10B981?style=flat-square" alt="License">
</p>

---

## What is Prompt2App?

Spinning up an interactive internal utility, analytics dashboard, calculator, or prototype usually requires project scaffolding, package installs, and hundreds of lines of boilerplate before you can test the idea. **Prompt2App** converts plain-English or spoken specifications into complete, runnable HTML5 applications streamed live from Groq LPU (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`), renders them across desktop, tablet, and mobile frames in an isolated browser sandbox with version history (`v1`, `v2`, `v3`), and exports a single offline-ready `.html` file.

> **Live demo →** [https://prompt2app.tanisheesh.in](https://prompt2app.tanisheesh.in)

---

## What you get

- **Real-time Groq LPU streaming** — Streams complete HTML5, Tailwind CSS, and JavaScript apps (`~450–1,000 tok/s`) with model switching, 3-model automatic fallback, and upstream abort cancellation.
- **Conversational edits & immutable snapshots** — Request follow-up refinements (*"Add CSV export"*, *"Improve mobile layout"*) to create `v2`, `v3` snapshots persisted in browser `localStorage`.
- **Cross-browser Whisper V3 Turbo voice & prompt enhancer** — Record prompts via `MediaRecorder` + `whisper-large-v3-turbo` in any browser, or expand a short idea into a full specification in one click.
- **Self-healing sandboxed workbench** — Preview Desktop (`100%`), Tablet (`768px`), and Mobile (`390px`) frames inside a cross-origin `<iframe srcDoc>` with an injected storage shim and 1-click AI runtime error patching.

---

## By the numbers

| Metric | Value | Source |
|---|---|---|
| Route execution caps | `60s` (`/api/generate`) · `30s` (`/api/enhance`, `/api/transcribe`) | `src/app/api/*/route.ts` |
| Groq SDK timeout & retries | `55s` timeout · `maxRetries: 2` · 3-model fallback chain | `src/lib/groq.ts` |
| Completion token caps | `32,768` (`GPT-OSS 120B/20B`) · `16,384` (`Qwen 3.8 27B`) · `600` (Enhance) | `src/lib/groq.ts`, `src/app/api/enhance/route.ts` |
| Request & audio bounds | `12,000` chars prompt · `250,000` chars refine HTML · `300 B–15 MB` audio | `src/app/api/*/route.ts` |
| Local snapshot capacity | Up to `25` projects · `15` versions/project with quota-safe pruning | `src/lib/storage.ts` |

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js `16.4.6` (App Router, Turbopack) · React `19.3.1` · TypeScript `7.0.2` · Tailwind CSS `3.4.19` · Radix UI |
| Backend API | Next.js Node.js Route Handlers (`ReadableStream`) · Zod `4.6.7` boundary validation |
| AI & Speech | `groq-sdk` `1.6.0` · `openai/gpt-oss-120b` · `qwen/qwen3.8-27b` · `openai/gpt-oss-20b` · `whisper-large-v3-turbo` |
| Infra & Security | Vercel · `vercel.json` security headers · GitHub Actions (CI, CodeQL, Gitleaks, Dependency Review, Renovate) |

---

## Engineering Decisions

**Why migrate from Firebase Genkit + Gemini Server Actions to streaming Groq Route Handlers?**
Non-streaming Server Actions forced users to wait 10–20 seconds behind a spinner while pulling heavy `genkit` and `firebase` packages. Streaming tokens over `ReadableStream` (`POST /api/generate`) delivers live line-count and `tok/s` telemetry, 3-model fallback, and instant upstream stream abort via `req.signal`.

**Why omit `allow-same-origin` on the preview iframe AND inject an in-memory `localStorage` shim?**
AI-generated scripts are untrusted JavaScript, so omitting `allow-same-origin` prevents XSS from reading host cookies or `prompt2app_projects_v2` storage. Because opaque-origin iframes throw `SecurityError` on `window.localStorage`, `injectSandboxRuntime()` injects an in-memory `Storage` polyfill and `postMessage` error bridge while keeping downloaded `.html` files clean.

**Why `MediaRecorder` + Groq `whisper-large-v3-turbo` instead of the browser Web Speech API?**
`window.SpeechRecognition` is Chrome-bound and fails across Firefox, Safari, and many mobile webviews. Recording `audio/webm` / `audio/mp4` chunks via `MediaRecorder` and transcribing server-side makes voice dictation reliable across all modern browsers.

**What would you do differently in the next iteration?**
Add AST-verified incremental DOM/script patching so minor edits on large (`> 800` line) apps apply sub-second without full regeneration, add Upstash per-IP rate limiting on `/api/*`, and introduce Vitest + Playwright E2E/a11y checks.

---

## Docs

| Document | Description |
|---|---|
| [PRD](docs/PRD.md) | Product requirements — quantified baseline, acceptance criteria, edge cases, quota math |
| [Architecture](docs/ARCHITECTURE.md) | System topology (Mermaid), API contracts, client storage schema, LLM safety, scale ceilings |
| [Decisions](docs/DECISIONS.md) | Architecture Decision Records — comparison matrices, tradeoffs, and reversal triggers |
| [Setup](docs/SETUP.md) | Local dev onboarding, env var matrix, verification commands, and troubleshooting |
| [Deploy](docs/DEPLOY.md) | Vercel topology, custom domain wiring, smoke checks, rollback, and incident runbooks |
| [Contributing](CONTRIBUTING.md) | Branching, emoji commit style, and PR checklist |
| [Changelog](CHANGELOG.md) | Release history mapped to commit history |
| [Security](SECURITY.md) | Vulnerability reporting policy and security scope |

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>

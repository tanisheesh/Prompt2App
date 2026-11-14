<p align="center">
  <img src="docs/logo.svg" width="64" height="64" alt="Prompt2App logo">
</p>

<h1 align="center">Prompt2App</h1>

<p align="center">
  <strong>Turn plain English or spoken prompts into working, multi-version, zero-dependency HTML5 web apps in seconds — powered by Groq LPU.</strong>
</p>

<p align="center">
  <a href="https://prompt2app.tanisheesh.in">
    <img src="https://img.shields.io/badge/live_demo-10B981-10B981?style=flat-square" alt="Live Demo">
  </a>
  <img src="https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Groq-F55036?style=flat-square" alt="Groq">
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">
  <img src="https://img.shields.io/badge/license-GPL--3.0-10B981?style=flat-square" alt="License">
</p>

---

## What is Prompt2App?

Spinning up an interactive internal utility, analytics dashboard, calculator, or prototype usually requires project scaffolding, npm installs, and hundreds of lines of boilerplate before you can even test the idea. **Prompt2App** turns a plain-English or spoken prompt into a complete, interactive HTML5 application that streams live at 500–1,000 tokens/sec via Groq LPU (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, and `openai/gpt-oss-20b`). You can test it immediately across desktop, tablet, and mobile viewports inside an isolated studio workbench, iterate conversationally across saved version snapshots (`v1`, `v2`, `v3`), and export a single `.html` file that runs offline in any browser forever.

> **Live demo →** [https://prompt2app.tanisheesh.in](https://prompt2app.tanisheesh.in)

---

## What you get

- **Real-time Groq LPU code streaming** — Streams complete HTML5, Tailwind CSS, and JavaScript applications at 500–1,000 tok/s with model switching (`GPT-OSS 120B`, `Qwen 3.8 27B`, `GPT-OSS 20B`), automatic fallback, and upstream abort cancellation.
- **Conversational edits & immutable version timeline** — Request follow-up changes (*"Add CSV export"*, *"Add plan filters"*) to create `v2`, `v3` snapshots stored locally in your browser so you can roll back anytime.
- **Universal Whisper V3 Turbo voice input & prompt enhancer** — Dictate prompts in Chrome, Firefox, Safari, or mobile via `MediaRecorder` + Groq `whisper-large-v3-turbo`, or expand a 3-word idea into a full product specification in one click.
- **Self-healing sandboxed workbench** — Preview across Desktop (`100%`), Tablet (`768px`), and Mobile (`390px`) frames in an isolated cross-origin iframe equipped with an injected storage shim and 1-click AI runtime error patching.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router, Turbopack) · React 18 · TypeScript 5 · Tailwind CSS 3 · Radix UI |
| Backend API | Next.js Route Handlers (`ReadableStream` streaming) · Zod request validation |
| AI & Speech | Groq Cloud SDK (`groq-sdk`) · `openai/gpt-oss-120b` · `qwen/qwen3.8-27b` · `openai/gpt-oss-20b` · `whisper-large-v3-turbo` |
| Infra & Hosting | Vercel · GitHub Actions CI · Dependabot Auto-Merge |

---

## Engineering Decisions

**Why migrate from Firebase Genkit + Gemini Server Actions to streaming Groq Route Handlers?**
Non-streaming Server Actions forced users to stare at a spinner for 10–20 seconds until the entire document finished generating, while pulling in heavy `genkit` and `firebase` packages. Streaming raw tokens from Groq's LPU over a `ReadableStream` (`POST /api/generate`) delivers 500–1,000 tok/s with live line-count telemetry, multi-model fallback, and instant upstream token cancellation via `AbortSignal` when the user clicks Stop.

**Why omit `allow-same-origin` on the preview iframe AND inject an in-memory `localStorage` shim?**
AI-generated code is untrusted JavaScript — omitting `allow-same-origin` isolates the host page's DOM, cookies, and workspace storage from XSS. Because browsers throw a `SecurityError` when opaque-origin scripts touch `window.localStorage`, `injectSandboxRuntime()` injects a transparent in-memory `Storage` polyfill and `window.onerror` `postMessage` bridge so stateful generated apps work seamlessly in preview and use real browser `localStorage` once downloaded.

**Why `MediaRecorder` + Groq `whisper-large-v3-turbo` instead of the browser Web Speech API?**
`window.SpeechRecognition` is Chrome-bound and fails silently in Firefox, Safari, and many mobile webviews. Capturing audio chunks through standard `MediaRecorder` (`audio/webm` / `audio/mp4`) and transcribing server-side via `whisper-large-v3-turbo` makes voice dictation reliable across every modern desktop and mobile browser.

**What would you do differently in v2?**
Add AST-verified incremental HTML/JS patching for follow-up edits on large (>800 line) applications so small CSS or text tweaks apply in under 500ms without regenerating the entire document.

---

## Docs

| Document | Description |
|---|---|
| [PRD](docs/PRD.md) | Product requirements — goals, user stories, non-goals |
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, component breakdown |
| [Decisions](docs/DECISIONS.md) | Every major technical decision and why |
| [Setup](docs/SETUP.md) | Local dev setup and env vars |
| [Deploy](docs/DEPLOY.md) | Production deployment, domains, rollback |
| [Contributing](CONTRIBUTING.md) | How to propose changes |
| [Changelog](CHANGELOG.md) | What changed in each release |
| [Security](SECURITY.md) | How to report a vulnerability |

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>

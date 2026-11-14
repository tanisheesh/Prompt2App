# Prompt2App — Product Requirements Document

**Status:** Final
**Owner:** Tanish Poddar
**One-liner:** Turn plain English or spoken prompts into working, multi-version, zero-dependency HTML5 web apps in seconds — powered by Groq LPU.

---

## 1. Problem

Building a quick interactive web tool — a SaaS telemetry dashboard, a Kanban board, an expense tracker, a synthesizer, or an API client — traditionally requires creating a project, installing packages, configuring bundlers, and writing hundreds of lines of HTML, CSS, and JavaScript. Existing prototyping tools either stop at static visual mockups (Figma) or require manual coding fluency (CodePen). Prompt2App eliminates that gap by converting a natural-language or spoken specification into a working, self-contained HTML5 application that runs immediately inside a sandboxed workbench and exports as a zero-dependency `.html` file.

---

## 2. Goals (v2)

1. Stream complete, runnable single-file HTML5 applications in real time via Groq LPU (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`) at 500–1,000 tokens/sec.
2. Provide a dedicated product landing page (`/`) and an interactive full-screen Studio workbench (`/studio`).
3. Support conversational multi-turn refinement (`v1`, `v2`, `v3`...) with version history stored locally in the user's browser.
4. Provide 1-click AI prompt expansion (`/api/enhance`) to turn brief 3-word ideas into detailed product specifications.
5. Support cross-browser voice dictation via `MediaRecorder` + Groq `whisper-large-v3-turbo` (`/api/transcribe`).
6. Render generated apps inside an isolated cross-origin `<iframe srcDoc>` with responsive Desktop (`100%`), Tablet (`768px`), and Mobile (`390px`) frames.
7. Prevent sandboxed storage crashes via an injected `localStorage` polyfill and surface uncaught JS errors with a 1-click **Fix error** action.
8. Allow 1-click export of the generated application as a standalone `.html` file, clipboard copy, or standalone browser tab preview.

---

## 3. Non-Goals (explicit scope cuts)

- **User accounts or cloud database** — Projects and version snapshots live in browser `localStorage`; keeping the server stateless eliminates auth friction and database infrastructure cost.
- **Public community prompt feed** — User prompts and generated apps stay private on the user's device rather than being published to a shared gallery.
- **Multi-file React/Next.js zip export** — A single self-contained `.html` file runs forever in any browser without Node.js, npm, or build steps.
- **Hosted deployment of generated apps** — Prompt2App compiles and exports portable apps; users can drop the exported `.html` onto Vercel, Netlify, or GitHub Pages if they want public hosting.

---

## 4. Users

**Primary:** Developers, indie hackers, and students who want to go from a plain-English idea to a working interactive web utility or prototype in seconds without project boilerplate.

**Secondary:** Product managers, designers, and founders demonstrating interactive product concepts; technical interviewers evaluating full-stack LLM streaming, sandboxing, and frontend craft.

---

## 5. User Stories

1. *As a developer,* I describe an app in plain English and watch code stream live so that I have a working interactive prototype in seconds.
2. *As a user with a brief idea,* I click **Enhance** so that my 4-word concept is expanded into a detailed UI and feature specification before building.
3. *As a user who prefers speaking,* I record my prompt via microphone so that Groq Whisper transcribes it accurately in any browser.
4. *As a user iterating on a prototype,* I type follow-up requests in the Studio sidebar (`v2`, `v3`...) and switch between versions so that I can add features without losing working snapshots.
5. *As a responsive UI tester,* I switch between Desktop, Tablet (`768px`), and Mobile (`390px`) frames so that I can verify layout behavior across screen sizes.
6. *As a user encountering a generated JS bug,* I click **Fix error** on the runtime diagnostics bar so that AI automatically patches the exception.
7. *As a user ready to ship,* I click **Download HTML** so that I get a standalone `.html` file that runs offline in any browser.

---

## 6. Functional Requirements

### 6.1 Prompt Composer & Starter Blueprints

- Multi-line prompt composer accepts plain-English specifications and submits on `Enter` (`Shift+Enter` inserts newline).
- Model dropdown switches between `GPT-OSS 120B` (default), `Qwen 3.8 27B`, and `GPT-OSS 20B`.
- **Enhance** button sends the draft prompt to `POST /api/enhance` and replaces the input with the expanded specification.
- Starter blueprint pills populate curated prompts or launch directly into `/studio`.

### 6.2 Voice Dictation

- Microphone button captures audio using `MediaRecorder` (`audio/webm;codecs=opus`, `audio/webm`, or `audio/mp4` fallback for Safari).
- Live recording timer (`0:00`) displays while active; stopping uploads the audio blob to `POST /api/transcribe` (`whisper-large-v3-turbo`) and appends the transcript to the prompt.
- Unmounting the component immediately stops active hardware microphone tracks.

### 6.3 Streaming AI Generation & Refinement

- `POST /api/generate` validates `{ prompt, model?, currentCode? }` with Zod and streams tokens from Groq over a `ReadableStream`.
- If the primary model fails or rate-limits, the server automatically cascades through `FALLBACK_MODELS`.
- Clicking **Stop** aborts the client `fetch` and cancels the upstream Groq stream via `AbortSignal`.
- `cleanHtmlOutput()` strips `<think>...</think>` blocks and outer markdown fences while preserving inline JS template literals.

### 6.4 Studio Workbench & Local Persistence

- Unified Studio toolbar provides `Preview`, `Code`, and `Split` views, `Desktop` / `Tablet` / `Mobile` viewport frames, model switching, reload, open in new tab, fullscreen (`Esc` to exit), copy, and `.html` download.
- Projects and up to 15 version snapshots per project persist in `localStorage` (`prompt2app_projects_v2`) with automatic quota-safe pruning.
- `injectSandboxRuntime()` injects an in-memory `Storage` fallback, empty-anchor navigation guard, and `window.onerror` / `unhandledrejection` `postMessage` bridge into the preview iframe.

---

## 7. Non-Functional Requirements

- **Latency:** First streamed token in `< 600ms`; typical 250–450 line HTML app completes in `1.5–4.5s` on Groq LPU.
- **Security:** `GROQ_API_KEY` accessed exclusively in server Route Handlers. Preview `<iframe>` omits `allow-same-origin` to enforce cross-origin isolation.
- **Cost & Token Safety:** Hard Zod input limits (`12,000` chars prompt, `250,000` chars refinement context, `15 MB` audio) and immediate upstream stream abort on client disconnect.
- **Reliability:** Multi-model fallback chain on `/api/generate` and `/api/enhance`; quota-safe `localStorage` persistence.
- **Responsiveness:** Full mobile (`360px`), tablet (`768px`), and desktop layouts across both `/` and `/studio` (including slide-out mobile version drawer and quick-edit bar).

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| Time to complete interactive app | `< 5s` end-to-end on Groq LPU |
| Sandbox crash rate on `localStorage` apps | `0%` (handled by injected storage polyfill) |
| Cross-browser voice dictation | Works in Chrome, Edge, Firefox, and Safari |
| Export portability | Downloaded `.html` opens offline with zero console errors |

---

## 9. Risks & Open Questions

- **Groq free/developer tier rate limits** — Sudden traffic spikes on a single model can hit TPM/RPM caps. Mitigated by automatic server-side fallback across `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, and `qwen/qwen3.8-27b`, plus upstream abort cancellation.
- **CDN dependencies inside exported HTML** — Generated apps load Tailwind CSS or Chart.js from public CDNs (`cdn.tailwindcss.com`, `cdn.jsdelivr.net`), so initial offline load requires browser cache if not connected to the internet.
- **Open question:** Should v3 support optional shareable read-only permalinks backed by edge KV storage?

---

## 10. v2+ Candidates

- **Incremental AST diff edits** — Patch targeted DOM/script sections during follow-up refinements instead of streaming the full HTML file on large apps.
- **Image-to-App vision input** — Upload a wireframe screenshot alongside a text prompt using multimodal vision models.
- **One-click deploy to Vercel / Netlify Drop** — Optional publish button for users who want an instant public URL for their generated app.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>

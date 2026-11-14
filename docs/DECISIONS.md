# Engineering Decisions — Prompt2App

---

## Decision 1 — Streaming Groq LPU Route Handlers over Firebase Genkit + Gemini Server Actions

**Context:** v1 used Firebase Genkit (`genkit`, `@genkit-ai/googleai`, `firebase`) inside a non-streaming Next.js Server Action with structured JSON output (`{ code: string }`). Users waited 10–20 seconds staring at a loading spinner until the entire HTML file finished generating.

**Decision:** Replace Genkit and Gemini with the official `groq-sdk` and a streaming Route Handler (`POST /api/generate`) backed by `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, and `openai/gpt-oss-20b`.

**Reason:** Groq's LPU inference streams tokens at 500–1,000 tok/s, reducing end-to-end generation of 300-line interactive apps to 1.5–4 seconds. Using a `ReadableStream` Route Handler enables real-time line-count and `tok/s` telemetry, server-side model fallback, and instant upstream token cancellation via `req.signal` when the user clicks Stop.

**Tradeoff:** Streaming raw HTML instead of blocking JSON schema mode requires deterministic post-processing (`cleanHtmlOutput()`) to strip `<think>` reasoning tags and outer markdown fences safely without touching inline JS template literals.

---

## Decision 2 — Strict Cross-Origin Sandbox (`sandbox` without `allow-same-origin`) + Injected Storage Shim

**Context:** Generated apps execute arbitrary LLM-written JavaScript inside `<iframe srcDoc>`. Granting `allow-same-origin` would expose the host origin's `localStorage` (all saved projects), cookies, and DOM to XSS. However, omitting `allow-same-origin` places the iframe in an opaque origin where any call to `window.localStorage` throws a `DOMException: SecurityError`, crashing todo lists, kanban boards, and trackers.

**Decision:** Keep `allow-same-origin` omitted on the preview `<iframe>` and inject a lightweight runtime script (`injectSandboxRuntime` in `src/lib/sandbox.ts`) into `<head>` before mounting `srcDoc`.

**Reason:** The injected script probes `window.localStorage` in a `try/catch` block and defines an in-memory `Storage`-compatible polyfill only when native storage is blocked, while leaving the user's downloaded `.html` file untouched so it uses real persistent `localStorage` when opened standalone. The same bridge captures uncaught runtime errors via `postMessage` to power 1-click AI bug fixing.

**Tradeoff:** Data entered inside the Studio preview resets when the preview iframe reloads, whereas data entered in the downloaded standalone `.html` file persists across browser restarts.

---

## Decision 3 — Immutable Version Snapshots (`v1`, `v2`, `v3`...) in `localStorage`

**Context:** One-shot generation rarely produces the final product on the first prompt; users want to request follow-up refinements ("Add CSV export", "Add plan filters") without risking a broken edit overwriting a working app.

**Decision:** Store each project in `localStorage` as an ordered array of immutable `AppVersion` snapshots (`prompt`, `code`, `model`, `durationMs`, `tokensPerSec`), passing the active version's `code` as context on follow-up edits.

**Reason:** Users get Git-like time travel across every iteration (`v1`, `v2`, `v3`...) with zero login friction and zero database hosting cost. Quota-safe pruning in `saveProjects()` automatically trims the oldest entries if the browser's 5 MB `localStorage` ceiling is reached.

**Tradeoff:** Workspace history is local to the current browser/device and does not sync across devices.

---

## Decision 4 — Universal Voice Dictation via `MediaRecorder` + Groq `whisper-large-v3-turbo`

**Context:** v1 relied on `window.SpeechRecognition` / `webkitSpeechRecognition`, which is unsupported in Firefox, unreliable in Safari/iOS, and drops technical vocabulary.

**Decision:** Record microphone audio via the standard `MediaRecorder` API (`audio/webm` with `audio/mp4` Safari fallback) and transcribe it server-side via Groq's `whisper-large-v3-turbo` (`POST /api/transcribe`).

**Reason:** `MediaRecorder` works across all modern desktop and mobile browsers, and `whisper-large-v3-turbo` transcribes technical software specifications and multilingual/Hinglish speech in under a second.

**Tradeoff:** Transcription happens after the user clicks Stop rather than word-by-word interim browser speech captions, and consumes a small audio API call per recording.

---

## What I'd do differently in v2

- **Incremental AST/DOM diff patching for refinements** — Currently, follow-up edits regenerate the complete HTML file (1.5–3.5s on Groq). Sending targeted search/replace blocks for minor edits on large (>800 line) apps would make iterations sub-second.
- **Optional cloud permalink sharing** — Add an opt-in "Share Read-Only Link" backed by Upstash Redis / Vercel Blob with content-hash deduplication so users can send live prototypes to teammates without emailing `.html` attachments.
- **Playwright end-to-end smoke suite in CI** — Automate headless browser verification of `/`, `/studio`, viewport frame switching, and sandboxed error interception on every pull request.

---

## Explicit non-decisions (deferred)

| Feature | Why deferred |
|---|---|
| User accounts & Postgres persistence | Adds OAuth friction and DB maintenance for a tool whose core value is instant, zero-signup prototyping |
| Multi-file React / Vite zip export | Requires `npm install` and Node.js to run; single-file `.html` runs anywhere with a double-click |
| Hosting user-generated apps on subdomains | Introduces phishing/abuse moderation and compute billing scope outside an app compiler |

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>

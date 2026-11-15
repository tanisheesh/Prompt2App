# Engineering Decisions — Prompt2App

---

## ADR-01 — Streaming Groq LPU Route Handlers over Firebase Genkit + Gemini Server Actions

**Context:** Prompt2App v1 used Firebase Genkit (`genkit`, `@genkit-ai/googleai`, `firebase`) inside a blocking Next.js Server Action returning structured JSON (`{ code: string }`). Users waited 10–20 seconds staring at a spinner with zero progress feedback and no cancellation support.

### Options Considered

| Option | Time to First Token / Total Build | Monthly Cost | Ops Complexity | Verdict |
|---|---|---|---|---|
| **Groq LPU `ReadableStream` Route Handler (`groq-sdk`)** | `< 1s` TTFT · `1.5–5s` total (`~450–1,000 tok/s`) | $0 free tier / low token cost | Low (1 stateless SDK) | ✅ **Chosen** |
| Firebase Genkit + Gemini Server Action (v1) | `10–20s` blocking spinner | Low–Medium | Medium (Genkit + Firebase deps) | ❌ Rejected |
| WebSocket custom Node server | `< 1s` TTFT | Dedicated server billing | High (incompatible with Vercel serverless) | ❌ Rejected |

**Decision & Reason:** Replace Genkit and Server Actions with `groq-sdk` (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`) behind `POST /api/generate` returning a `ReadableStream<Uint8Array>`. This streams live line-count and `tok/s` telemetry, enables automatic 3-model fallback (`FALLBACK_MODELS`), and immediately aborts upstream Groq tokens via `req.signal` when users click **Stop**.

**Tradeoff Accepted:** Streaming raw HTML instead of waiting for blocking JSON schema output requires deterministic stream sanitization (`cleanHtmlOutput()`) to remove `<think>` tags and outer markdown fences without touching inline JavaScript template literals.

**Reversal Trigger:** Revisit if Groq discontinues high-speed open-weight coding models or if full-document streaming latency exceeds `8s` p95 — introduce targeted AST/diff patching or add another OpenAI-compatible inference provider.

---

## ADR-02 — Strict Cross-Origin Sandbox (`allow-same-origin` Omitted) + Injected Storage Shim

**Context:** Previewing LLM-generated HTML/JS inside an `<iframe>` creates XSS exposure: granting `allow-same-origin` would let generated JavaScript read Prompt2App's host `localStorage` (`prompt2app_projects_v2`), DOM, and cookies. However, omitting `allow-same-origin` puts the iframe in an opaque origin (`null`) where calling `window.localStorage` throws `DOMException: SecurityError`, breaking generated todo lists, Kanban boards, and budget trackers.

### Options Considered

| Option | Host XSS Isolation | Stateful App Compatibility | Infra Complexity | Verdict |
|---|---|---|---|---|
| **Opaque `sandbox` + injected memory `Storage` shim** | Full origin isolation | Works in preview + real `localStorage` on export | Low (`src/lib/sandbox.ts`) | ✅ **Chosen** |
| Permissive `sandbox="allow-scripts allow-same-origin"` | Vulnerable to host storage/DOM theft | Native `localStorage` | Low | ❌ Rejected |
| Wildcard preview subdomain (`*.preview.tanisheesh.in`) | Strong origin isolation | Native `localStorage` | High (wildcard DNS, TLS, edge routing) | ❌ Rejected |

**Decision & Reason:** Keep `allow-same-origin` and `allow-top-navigation` omitted on `<iframe srcDoc>` in `PreviewCanvas`, and inject `injectSandboxRuntime()` into `<head>` during preview only. The shim installs an in-memory `Storage` polyfill whenever native `localStorage` throws, guards empty `href="#"` navigation, and reports uncaught errors back via instance-scoped `postMessage`, while exported `.html` files stay untouched.

**Tradeoff Accepted:** State inside the Studio preview resets on preview reload (`reloadKey`), whereas downloaded standalone `.html` files persist data across browser restarts.

**Reversal Trigger:** Revisit if users require persistent state across iframe reloads inside Studio — bridge `localStorage` calls over keyed `postMessage` namespaces or host previews on a separate isolated domain.

---

## ADR-03 — Immutable Version Snapshots in Browser `localStorage` over Server Postgres + Auth

**Context:** Iterative refinement requires safe rollbacks (`v1`, `v2`, `v3`...) when a follow-up prompt breaks an app. Adding user login and a hosted database introduces onboarding friction and operational overhead for quick throwaway or exploratory prototypes.

### Options Considered

| Option | Onboarding Friction | Monthly Cost | Cross-Device Sync | Verdict |
|---|---|---|---|---|
| **Client `localStorage` (`25` projects × `15` versions)** | Zero (instant use on `/`) | $0 | Local browser only | ✅ **Chosen** |
| Postgres (Neon/Supabase) + OAuth | Requires sign-in before saving | $0–$25/mo | Full sync + share links | ❌ Rejected |

**Decision & Reason:** Persist ordered, immutable `AppVersion` arrays per `ProjectItem` under `prompt2app_projects_v2`, passing the active version's `code` (`<= 250,000` chars) on follow-up edits and pruning oldest snapshots automatically if the ~5 MB browser storage quota fills up.

**Tradeoff Accepted:** Projects remain local to one browser profile and do not sync across devices or generate shareable permalinks.

**Reversal Trigger:** Revisit when users request shareable live URLs or hit the 5 MB `localStorage` ceiling on large multi-version sessions — migrate storage to `IndexedDB` and add opt-in content-addressed read-only snapshots.

---

## ADR-04 — Universal Voice Dictation via `MediaRecorder` + Groq `whisper-large-v3-turbo`

**Context:** Prompt2App v1 relied on `window.SpeechRecognition` / `webkitSpeechRecognition`, which failed completely in Firefox, behaved inconsistently on Safari/iOS, and frequently mangled programming terminology.

### Options Considered

| Option | Browser Support | Technical Term Accuracy | API Cost | Verdict |
|---|---|---|---|---|
| **`MediaRecorder` (`webm`/`mp4`) + `whisper-large-v3-turbo`** | Chrome, Edge, Firefox, Safari/iOS | High (multilingual & dev terms) | Low per audio clip (`<= 15 MB`) | ✅ **Chosen** |
| Browser Web Speech API (`SpeechRecognition`) | Chromium only | Low–Medium | $0 | ❌ Rejected |

**Decision & Reason:** Capture audio via `MediaRecorder` (`audio/webm;codecs=opus` → `audio/webm` → `audio/mp4` Safari fallback) and transcribe server-side via Groq `whisper-large-v3-turbo` (`POST /api/transcribe`), releasing microphone tracks on stop or component unmount.

**Tradeoff Accepted:** Transcripts appear after clicking stop rather than live word-by-word captions, and each recording consumes one Whisper transcription call.

**Reversal Trigger:** Revisit only if real-time streaming voice captions become mandatory — upgrade to WebSocket streaming STT.

---

## ADR-05 — `Permissions-Policy: camera=(), microphone=(self), geolocation=()` in `vercel.json`

**Context:** Standard static security header templates set `Permissions-Policy: camera=(), microphone=(), geolocation=()`, which blocks `navigator.mediaDevices.getUserMedia({ audio: true })` across the entire origin and would silently break Prompt2App's Whisper voice dictation in production.

### Options Considered

| Option | Protects Third-Party / Sandboxed Iframes | Preserves Voice Input on Studio | Ops Effort | Verdict |
|---|---|---|---|---|
| **`camera=(), microphone=(self), geolocation=()`** | Yes (blocks opaque iframes & external origins) | Yes (`/` and `/studio`) | Zero (`vercel.json`) | ✅ **Chosen** |
| Blanket `microphone=()` | Yes | ❌ Breaks voice recorder in prod | Zero | ❌ Rejected |
| Omit `Permissions-Policy` header | No | Yes | Zero | ❌ Rejected |

**Decision & Reason:** Scope `microphone=(self)` in `vercel.json` so Prompt2App's own pages can access the microphone on user gesture while keeping camera, geolocation, and all cross-origin/opaque preview iframes locked down.

**Tradeoff Accepted:** Relies on browser `Permissions-Policy` enforcement rather than removing audio hardware permissions altogether.

**Reversal Trigger:** Only tighten to `microphone=()` if voice dictation is ever removed from Prompt2App.

---

## What I'd Do Differently Next

- **Incremental AST/DOM diff patching for edits** — Follow-up refinements currently regenerate the complete HTML file; sending targeted patches on apps `> 800` lines would drop edit latency below 1 second.
- **Upstash per-IP rate limiting on `/api/*`** — Add sliding-window protection before scaling traffic so heavy users cannot exhaust shared Groq TPM/RPM quotas.
- **Automated unit + Playwright E2E/a11y test suite** — Add Vitest tests for `cleanHtmlOutput`, `injectSandboxRuntime`, `storage.ts`, and API Zod validation plus Playwright checks across `390px` / `1280px`.

---

## Explicit Non-Decisions (Deferred)

| Feature | Why Deferred | Trigger to Build |
|---|---|---|
| User accounts & server DB | Zero-signup immediacy is core to the product | > 500 weekly users requesting cross-device sync or share links |
| Multi-file React / Vite zip export | Adds Node/npm build barrier for end users | Sustained demand for multi-route exported apps |
| Hosting user-generated apps on subdomains | Brings abuse/phishing moderation outside compiler scope | Dedicated abuse-scanning & quota infrastructure in place |

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>

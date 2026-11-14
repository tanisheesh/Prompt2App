# Prompt2App — Architecture

---

## 1. Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.4.6 (App Router, TypeScript 7, Turbopack) |
| AI Code Generation | Groq Cloud SDK (`groq-sdk`) — `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, `openai/gpt-oss-20b` |
| Speech-to-Text | Groq `whisper-large-v3-turbo` via `MediaRecorder` + `POST /api/transcribe` |
| Styling & UI | Tailwind CSS 3 · Radix UI (`dialog`, `dropdown-menu`, `scroll-area`, `sheet`, `toast`) · Lucide Icons |
| Fonts | `next/font/google` — `Inter` (`--font-inter`) & `JetBrains Mono` (`--font-jetbrains-mono`) |
| Validation | Zod request boundary validation |
| Persistence | Browser `localStorage` (`prompt2app_projects_v2`) with quota-safe pruning |
| Hosting & CI | Vercel · GitHub Actions (`CI`, Dependabot auto-merge, weekly maintenance report) |

---

## 2. Components

```text
src/
  app/
    api/
      generate/route.ts          Streaming HTML generation & multi-turn refinement
      enhance/route.ts           AI prompt specification expander
      transcribe/route.ts        Audio transcription via Groq Whisper Large V3 Turbo
    studio/
      page.tsx                   Dedicated interactive App Builder Studio (/studio)
    layout.tsx                   Root layout, self-hosted fonts, SEO metadata, JSON-LD
    page.tsx                     Product Landing Page (Hero, Capabilities, Examples, FAQ)
    globals.css                  Obsidian dark tokens & custom scrollbar styles
    icon.svg                     Vector brand favicon
    apple-icon.tsx               Dynamic 180x180 Apple touch icon
    opengraph-image.tsx          Dynamic 1200x630 OpenGraph / Twitter card
    manifest.ts                  Web App Manifest
    robots.ts                    Crawler rules
    sitemap.ts                   XML sitemap (/ and /studio)
  components/
    brand-logo.tsx               Shared terminal-prompt vector logo
    studio/
      studio-header.tsx          Minimal Studio navigation header
      workspace-toolbar.tsx      Unified workbench bar (views, viewports, model, export)
      prompt-composer.tsx        Prompt box, model dropdown, voice input, Enhance button
      voice-recorder-button.tsx  MediaRecorder audio capture + Whisper transcription
      starter-templates.tsx      Reusable starter prompt pills
      preview-canvas.tsx         Sandboxed iframe stage, device frames, error banner
      code-viewer.tsx            Streaming line-numbered HTML viewer with search & copy
      project-sidebar.tsx        Immutable version timeline (v1, v2...) & follow-up chat
      projects-dialog.tsx        Saved local workspace modal
    ui/                          Lean Radix UI primitives (6 used components only)
  hooks/
    use-toast.ts                 Lightweight toast queue hook
  lib/
    groq.ts                      Singleton Groq client, model catalog, HTML stream cleaner
    prompts.ts                   System prompts (generate, refine, enhance) & templates
    sandbox.ts                   Iframe storage polyfill, link guard & error postMessage bridge
    storage.ts                   LocalStorage project/version manager with quota pruning
    types.ts                     Shared TypeScript interfaces
    utils.ts                     Tailwind class merge utility
  types/
    global.d.ts                  Asset & stylesheet module declarations for TypeScript 7
```

### Streaming Generation Route (`src/app/api/generate/route.ts`)

Receives `{ prompt, model?, currentCode? }`, validates bounds with Zod, selects either `SYSTEM_PROMPT_GENERATE` (fresh app) or `SYSTEM_PROMPT_REFINE` (follow-up edit with `currentCode` context), and opens a streaming completion against Groq. Cascades across `FALLBACK_MODELS` if a model errors on connection/rate-limit, exposes the chosen model via `X-Model-Used`, and aborts the upstream Groq stream immediately if `req.signal` cancels.

### Studio Workbench (`src/app/studio/page.tsx`)

Client workspace controller managing project state, live `ReadableStream` decoding, token-per-second telemetry, version time-travel (`v1`, `v2`, `v3`...), responsive device frames (`Desktop`, `Tablet`, `Mobile`), mobile slide-out drawer, and standalone `.html` Blob downloads.

### Sandbox Runtime Bridge (`src/lib/sandbox.ts`)

Pre-processes generated HTML before mounting into `<iframe srcDoc>`. Injects dark scrollbar rules, a `try/catch` in-memory `localStorage` / `sessionStorage` polyfill for opaque sandbox origins, an empty-href click guard so `href="#"` links never blank the preview, and an instance-scoped `window.onerror` + `unhandledrejection` bridge that posts runtime errors to the parent Studio for 1-click AI patching.

---

## 3. Data Flow

```text
[User enters prompt on / or /studio, or dictates via MediaRecorder -> /api/transcribe]
        |
        v
[POST /api/generate { prompt, model, currentCode? }]
        |
        v  (Zod validation -> Groq chat.completions.create({ stream: true }))
[ReadableStream<Uint8Array> chunks at 500-1,000 tok/s]
        |
        v
[Client TextDecoder -> cleanHtmlOutput() strips <think> & outer fences]
        |
        v
[Saved as AppVersion (v1, v2...) in React state + localStorage]
        |
        v
[injectSandboxRuntime(code, instanceId) injects storage shim & error listener]
        |
        v
[<iframe srcDoc={sandboxedHtml} sandbox="allow-scripts allow-forms allow-popups allow-modals allow-downloads">]
```

1. User submits a prompt (or clicks a starter blueprint) on `/` or `/studio`.
2. `/studio` opens a `fetch` stream with an `AbortController` to `POST /api/generate`.
3. As chunks arrive, `cleanHtmlOutput()` sanitizes reasoning tags and outer fences while live line-count and `tok/s` telemetry update in the UI.
4. Once streaming finishes, the complete HTML document is persisted as a versioned snapshot (`AppVersion`) inside `localStorage`.
5. `PreviewCanvas` injects the sandbox runtime shim and mounts the interactive app inside the selected viewport frame (`100%`, `768px`, or `390px`).

---

## 4. Client Storage Schema (`localStorage`)

Prompt2App is intentionally stateless on the server. Client state is stored under `prompt2app_projects_v2`:

- `ProjectItem` — `{ id, title, createdAt, updatedAt, currentVersionId, versions: AppVersion[] }` (capped at 25 projects).
- `AppVersion` — `{ id, versionNumber, prompt, code, model, createdAt, durationMs?, tokensPerSec? }` (capped at 15 versions per project, with automatic oldest-project pruning if the 5 MB browser quota is reached).

---

## 5. AI / LLM Design

### Input

- **Initial build:** Plain-text user specification (`2–12,000` chars).
- **Iterative refinement:** Current complete HTML (`<= 250,000` chars) + the user's change request or captured JS runtime error message.

### System prompt strategy

- Enforces raw `<!DOCTYPE html>...</html>` output with zero markdown fences or conversational prose.
- Instructs the model to include `<meta viewport>`, Tailwind CSS CDN, Google Fonts (`Inter`, `JetBrains Mono`), realistic pre-populated sample data, `e.preventDefault()` on forms, and `try/catch` storage wrappers.

### Output sanitization & validation

Because LLM tokens stream live rather than waiting for blocking JSON mode, `cleanHtmlOutput()` (`src/lib/groq.ts`) handles output hygiene deterministically:
- Removes `<think>...</think>` reasoning blocks emitted by open-weight reasoning models.
- Strips leading/trailing markdown code fences only at document boundaries so inline JS template literals (`` ` ``) are never corrupted.
- Verifies non-empty HTML completion before committing a new version snapshot.

### Failure handling

- Server-side model loop automatically falls back across `openai/gpt-oss-120b` → `openai/gpt-oss-20b` → `qwen/qwen3.8-27b`.
- Runtime JS exceptions inside the generated app are caught in the iframe and surfaced in a non-blocking banner with a 1-click **Fix error** button that feeds the exact error message back into the refinement pipeline.

---

## 6. API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/generate` | Streams complete or refined single-file HTML5 apps from Groq LPU with model fallback and abort propagation |
| `POST` | `/api/enhance` | Expands a brief app concept into a 2–4 sentence product & UI specification |
| `POST` | `/api/transcribe` | Validates uploaded audio (`<= 15 MB`) and transcribes speech via `whisper-large-v3-turbo` |

---

## 7. Security

- **API key isolation:** `GROQ_API_KEY` is read only inside Node.js server routes (`src/lib/groq.ts`); no `NEXT_PUBLIC_` secret variables exist.
- **Cross-origin iframe sandboxing:** Preview iframes omit `allow-same-origin`, preventing AI-generated scripts from reading host cookies, DOM, or `prompt2app_projects_v2` storage.
- **Strict boundary validation:** Every API endpoint validates request JSON / file size limits via Zod and returns `X-Content-Type-Options: nosniff`.
- **Resource exhaustion protection:** Client `Stop` or tab close aborts the server `ReadableStream` and terminates the upstream Groq completion immediately.

---

## 8. Error Handling & Reliability

| Failure | Behaviour |
|---|---|
| Primary Groq model rate-limited / 5xx | Server cascades to next model in `FALLBACK_MODELS` transparently |
| User clicks Stop mid-stream | `AbortController` cancels fetch; server aborts Groq stream; previous version remains intact |
| Generated app calls `localStorage` in sandbox | Injected shim provides in-memory `Storage` fallback instead of throwing `SecurityError` |
| Generated app throws uncaught JS error | `window.onerror` posts error to Studio; **Fix error** button patches it in one click |
| Browser `localStorage` 5 MB quota full | `saveProjects()` prunes oldest projects/versions until write succeeds |

---

## 9. Deployment

1. Vercel project connected to `tanisheesh/Prompt2App` — auto-deploys on push to `main`.
2. `GROQ_API_KEY` configured in Vercel Project Settings → Environment Variables.
3. Custom domain `prompt2app.tanisheesh.in` routed via GoDaddy CNAME to Vercel (`cname.vercel-dns.com`).
4. GitHub Actions (`ci.yml`) runs `pnpm install --frozen-lockfile`, `pnpm run typecheck`, and `pnpm run build` on every push and PR.

---

## 10. Explicit Scope Cuts

- **Server database & authentication** — Deferred; browser `localStorage` keeps the tool zero-login and zero-infra-cost.
- **Multi-file framework export** — Deferred; single-file HTML5 guarantees universal offline execution without build tooling.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>

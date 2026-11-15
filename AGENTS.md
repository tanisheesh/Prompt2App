# Prompt2App — Agent Development Guidelines

Follow these rules strictly on every file you create or modify in **Prompt2App**.

---

## 1. File Organization & Architecture

- **File naming:**
  - TypeScript / JavaScript: ALWAYS use `kebab-case` (`voice-recorder-button.tsx`, `use-toast.ts`), except framework-required Next.js files (`page.tsx`, `layout.tsx`, `route.ts`, `manifest.ts`, `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, `apple-icon.tsx`).
- **File size limit:** Keep files focused and **under 300 lines**. When approaching 300 lines (e.g., `src/app/page.tsx`, `src/app/studio/page.tsx`, `src/components/studio/workspace-toolbar.tsx`), split new additions into cohesive modules rather than growing monoliths.
- **Layered separation:**
  - `src/components/ui/` — pure, domain-agnostic Radix/Tailwind primitives (`dialog`, `dropdown-menu`, `scroll-area`, `sheet`, `toast`). Zero `fetch()` calls or business logic inside `ui/`.
  - `src/components/studio/` — domain UI composed from `ui/` primitives (`prompt-composer.tsx`, `preview-canvas.tsx`, `code-viewer.tsx`, `project-sidebar.tsx`, `workspace-toolbar.tsx`, `voice-recorder-button.tsx`, `starter-templates.tsx`, `projects-dialog.tsx`).
  - `src/hooks/` — reusable client hooks (`use-toast.ts`).
  - `src/lib/` — pure business logic, Groq SDK singleton, model catalog, prompt templates, iframe sandbox bridge (`sandbox.ts`), `localStorage` snapshot manager (`storage.ts`), and shared types (`types.ts`).
  - `src/app/api/` — thin Next.js App Router Route Handlers (`generate/route.ts`, `enhance/route.ts`, `transcribe/route.ts`): validate request boundaries with Zod/File checks → call `src/lib/groq.ts` → return streaming or JSON response.
- **Reusability (Rule of Two):** Extract any repeated UI pattern, model selector, or stream/storage helper used 2+ times into a shared primitive or module. Prefer props composition over boolean flag explosion.
- **App Router only (Next.js):** Never add or expand routes in `pages/`. Always use `src/app/`.

---

## 2. Code Style & Strictness

- **No dead code or debug clutter:** Never leave unused imports, commented-out blocks, or stray `console.log` statements.
- **Named exports at definition:** Prefer `export async function foo()` / `export function bar()` at definition point. Only use `export default` where Next.js requires it (`page.tsx`, `layout.tsx`, `next.config.ts`, `manifest.ts`, `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, `apple-icon.tsx`).
- **Control flow & async:** Use `async/await` (no raw `.then()` chains or nested callbacks). Prefer early returns with `if/else` and lookup objects over sprawling `switch` blocks. Use `for...of` for async iteration (`Array.prototype.forEach` does not await).
- **Strict equality:** Always use `===` and `!==` (never `==` / `!=`).
- **Type safety:** NEVER use `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck`. Avoid `any` — use `unknown` + Zod/type-guard narrowing. Share interfaces through `src/lib/types.ts` or derive types from Zod schemas.
- **Error handling:** Let pure helpers throw descriptive `Error` instances. Catch explicitly at API, stream, `localStorage`, `MediaRecorder`, and UI boundaries — NEVER add empty or silent `catch {}` blocks without explicit handling or documented storage fallback.
- **Directives first:** In Next.js/React client components (`'use client'`), put the directive on **line 1** before any imports or comments.

---

## 3. UI Craft & Anti-AI-Slop Rules

- **Banned clichés:**
  - No generic purple/indigo/pink linear gradients, neon box-shadow glows, or rainbow badge spam.
  - No cookie-cutter 3-column icon-in-circle marketing grids inside studio views.
  - No emoji-prefixed app UI headings, hype copy (*"Supercharge..."*), or fabricated user stats.
  - No dead buttons (`onClick={() => {}}`) or `window.alert()`.
- **Design discipline:** Stick to Prompt2App's obsidian dark CSS tokens (`#0C0C0E` background, `#131316` cards, `#242429` `1px` borders, `#10B981` emerald status/brand accent), `lucide-react` icons, and `tabular-nums` on token-per-second telemetry, line counts, and timers.
- **Mandatory 4 states:** Every interactive/async view (`PreviewCanvas`, `CodeViewer`, `ProjectsDialog`, `VoiceRecorderButton`) must handle **Loading** (streaming line count / transcribing spinner), **Empty** (guided starter blueprints / empty apps state), **Error** (toast / runtime error banner with **Fix error** action), and **Populated**.
- **Accessibility & responsiveness:** Semantic HTML (`<button>`, `<label>`, `<main>`, `<aside>`), visible focus states, WCAG AA contrast, zero horizontal overflow across mobile (`390px`), tablet (`768px`), and desktop (`1280px`).

---

## 4. Security & Sandbox Rules

- **Boundary validation:** Validate all API payloads with Zod (`prompt` length `2..12,000` on `/api/generate`, `2..4,000` on `/api/enhance`, `currentCode <= 250,000`) and enforce audio file bounds (`300 B..15 MB`) on `/api/transcribe`.
- **Secrets isolation:** `GROQ_API_KEY` must remain server-only in `src/lib/groq.ts`. Never prefix secrets with `NEXT_PUBLIC_`. Never commit `.env` or `.env.local`; keep `.env.example` updated with empty values. Never log API keys or raw user credentials.
- **Cross-origin iframe isolation:** Never add `allow-same-origin` or `allow-top-navigation` to the preview `<iframe srcDoc>` in `src/components/studio/preview-canvas.tsx`. Generated apps must remain isolated from host cookies, DOM, and `prompt2app_projects_v2` `localStorage`.
- **HTTP headers (`vercel.json`):** Preserve `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, and `Permissions-Policy: camera=(), microphone=(self), geolocation=()` (keep `(self)` so Whisper voice recording works on the app origin while staying blocked inside opaque-origin iframes).
- **LLM safety & stream hygiene:** Separate system instructions (`src/lib/prompts.ts`) from user prompts and `currentCode` delimiters, enforce `max_completion_tokens` (`32,768` / `16,384` / `600`) and Groq client timeout (`55_000ms`), propagate `req.signal` aborts upstream, and sanitize streamed HTML via `cleanHtmlOutput()` without corrupting inline JS template literals.

---

## 5. Testing & Verification

- **No work is complete without verification:**
  - New pure helpers/validators (`cleanHtmlOutput`, `injectSandboxRuntime`, `storage.ts`) → add unit tests covering happy path, null/empty, fence/template-literal edge cases, and quota pruning.
  - New or modified API routes (`/api/generate`, `/api/enhance`, `/api/transcribe`) → test `200`, `400`, `413`, `499`, `500`, `502` and abort behavior.
  - Bugfixes → add a regression check reproducing the bug before fixing.
  - UI changes → verify mobile (`390px`), tablet (`768px`), and desktop (`1280px`) with zero console/page errors.
- **Never bypass checks:** Never delete tests, add `.skip`, or weaken TypeScript `strict: true` to force green CI.

### Verification Commands (Run Before Finishing)

```bash
pnpm run typecheck   # next typegen && tsc --noEmit
pnpm run build       # next build (Turbopack production build)
```

*(Note: `lint` and automated `test` scripts are not yet configured in `package.json`; add Vitest + Playwright checks when expanding test coverage.)*

If `coderabbit` CLI is installed locally, optionally run a pre-PR review on your changes:

```bash
coderabbit review --agent --uncommitted
```

---

## 6. Git & Commit Rules

- **Atomic commits:** `<emoji> [#issue] [scope:] <present tense lowercase message>` (see `CONTRIBUTING.md`).
- **PRs:** Use plain-English **past-tense** PR titles, fill `.github/PULL_REQUEST_TEMPLATE.md`, and keep docs, `.env.example`, and verification checks in the same PR.
- **Safety:** Never force-push or run `git reset --hard` on `main`. Record any production rollback SHA and reason in a commit or PR.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>

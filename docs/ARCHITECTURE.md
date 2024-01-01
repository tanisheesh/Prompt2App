# Prompt2App — Architecture

<!--
Companion to PRD.md.
PRD says WHAT the system does. This says HOW.
Audience: an engineer who needs to understand the system well
enough to build it, debug it, or extend it.
-->

---

## 1. Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15.3.3 (App Router, TypeScript) |
| AI | Google Gemini 2.0 Flash via Firebase Genkit (`genkit` 1.8 · `@genkit-ai/googleai`) |
| Styling | Tailwind CSS 3 · Radix UI (shadcn/ui components) |
| Fonts | Inter (body) · Space Grotesk (headline) · Source Code Pro (code) |
| Forms | React Hook Form · Zod |
| Icons | Lucide React |
| Hosting | Vercel |

---

## 2. Components

```
src/
  ai/
    genkit.ts              Genkit client init — Google AI plugin + Gemini 2.0 Flash model
    dev.ts                 Genkit dev server entrypoint (local flow inspection UI)
    flows/
      app-generator.ts     Core AI flow: natural language prompt → HTML app code
  app/
    layout.tsx             Root layout — metadata, font preloads, Toaster provider
    page.tsx               Single page — prompt input, voice, preview + code tabs
    globals.css            Design tokens (vivid purple theme), Tailwind base
    favicon.ico            Browser tab icon
  components/
    ui/                    shadcn/ui components (Button, Card, Tabs, Textarea, Toast, etc.)
  hooks/
    use-mobile.tsx         Viewport-width mobile detection hook
    use-toast.ts           Toast queue hook
  lib/
    utils.ts               Tailwind class merge utility (clsx + tailwind-merge)
```

### AI Flow (`src/ai/flows/app-generator.ts`)

Defines a Genkit flow (`generateAppFlow`) and a structured prompt (`generateAppPrompt`). Receives a natural-language description, sends it to Gemini 2.0 Flash with a detailed system prompt, and returns `{ code: string }` — a complete self-contained HTML document. Exported as a Next.js Server Action (`'use server'`). Does not perform any streaming; awaits the full structured response before returning.

### Main Page (`src/app/page.tsx`)

Client component. Manages all UI state: prompt text, loading flag, generated HTML, and voice recognition state. Calls the `generateApp` Server Action directly (no fetch/REST). Renders the generated HTML in an `<iframe srcDoc>` on the Preview tab. Handles download by creating a Blob URL client-side.

### Genkit Init (`src/ai/genkit.ts`)

Bootstraps the Genkit instance with the Google AI plugin. Model is set globally to `googleai/gemini-2.0-flash`. All flows registered against this instance inherit the model unless overridden.

---

## 3. Data Flow

```
[User types or speaks a prompt]
        |
        v
[page.tsx: handleGenerateApp()]
        |
        v  (Next.js Server Action call)
[app-generator.ts: generateApp(input)]
        |
        v
[generateAppFlow → generateAppPrompt]
        |
        v  (HTTPS to Google AI)
[Gemini 2.0 Flash]
        |
        v  structured JSON: { code: "<html>..." }
[Zod schema validation]
        |
        v
[React state: setGeneratedCode(html)]
        |
        v
[<iframe srcDoc={html}> — sandboxed live preview]
        |
        v  (optional)
[User clicks "Save HTML" → Blob download]
```

1. User enters a description in the textarea or dictates via Web Speech API.
2. Clicking "Create App" calls the `generateApp` Server Action with the prompt string.
3. Genkit routes the call through `generateAppFlow`, which invokes `generateAppPrompt` against Gemini 2.0 Flash.
4. The system prompt instructs Gemini to produce a complete, self-contained HTML file using vanilla JS and browser APIs only.
5. Gemini returns structured JSON; Zod validates against `GenerateAppOutputSchema`.
6. The `code` string is stored in React state and rendered into `<iframe srcDoc>` for an instant live preview.
7. The Code tab renders the raw HTML in a scrollable `<pre>` block.
8. "Save HTML" creates a `Blob` from the string and triggers a browser download of `prompt2app_preview.html`.

---

## 4. Database Schema

No database. Prompt2App is entirely stateless — generated HTML exists only in React state for the current session. There is no user data, session persistence, or server-side storage.

---

## 5. AI / LLM Design

### Input

A single natural-language string: the user's app description. No pre-processing or truncation — passed as-is to the model.

### System prompt strategy

The system prompt instructs Gemini to act as an "expert and imaginative AI web app developer." Key constraints baked into the prompt:

- Output must be a single self-contained HTML file (inline CSS and JS) — no external script references beyond absolute CDN URLs for images.
- Use vanilla JavaScript and browser-native APIs (`localStorage`, `speechSynthesis`, `SpeechSynthesisUtterance`, `setInterval`, etc.) — no frameworks.
- Design must be visually appealing, colorful, modern, and mobile-responsive.
- No server-side code — fully client-side.
- Include basic error handling for unsupported browser APIs.

The prompt includes a concrete worked example (daily planner with voice reminders) to anchor the model's understanding of "fully functional."

### Response schema

```jsonc
{
  "code": "string"  // Complete HTML document string
}
```

Defined with Zod (`GenerateAppOutputSchema`). Genkit's structured output feature enforces this schema in the model call.

### Validation

Output is validated by Genkit's built-in Zod schema enforcement before the Server Action returns. If the model returns malformed output (missing `code` field), the call throws and the catch block in `page.tsx` surfaces a toast error to the user.

### Failure handling

All AI calls are wrapped in try/catch in `page.tsx`. On any error (network, rate limit, malformed output), a destructive toast notification is shown: "App Generation Failed — [error message]". The loading state is cleared and `generatedCode` remains `null`. No retry logic — user can re-click "Create App" manually.

---

## 6. API Routes

Prompt2App uses no traditional REST API routes. The AI call is a Next.js Server Action.

| Type | Name | Description |
|---|---|---|
| Server Action | `generateApp(input)` | Accepts `{ prompt: string }`, calls Gemini via Genkit, returns `{ code: string }` |

---

## 7. Security

- **API key:** `GOOGLE_GENAI_API_KEY` stored in `.env` (gitignored). Accessed only inside the Server Action — never reaches the browser. No `NEXT_PUBLIC_` prefix.
- **Generated app sandboxing:** The `<iframe>` uses `sandbox="allow-scripts allow-forms allow-popups"`. `allow-same-origin` is intentionally omitted — generated JS cannot access the host page's DOM, cookies, or localStorage.
- **No user data stored:** No auth, no database, no session data beyond in-memory React state. Nothing to leak.

---

## 8. Error Handling & Reliability

| Failure | Behaviour |
|---|---|
| Gemini API down / rate-limited | `generateApp` throws; catch block shows destructive toast; loading cleared |
| Malformed AI output (no `code` field) | Zod validation fails in Genkit; same catch path |
| Empty prompt submitted | Client-side guard before calling Server Action; destructive toast shown |
| Voice input unsupported | Mic button disabled; explanatory text rendered below form |
| Voice recognition error | `onerror` handler fires; destructive toast with specific error reason |
| Download with no generated code | Guard check; destructive toast shown |

---

## 9. Deployment

1. Vercel project linked to GitHub repository — auto-deploy on push to `main`.
2. `GOOGLE_GENAI_API_KEY` set in Vercel project dashboard under Environment Variables.
3. No database migrations needed — stateless app.
4. Development server runs on port `9002` (`npm run dev -- -p 9002`).

---

## 10. Explicit Scope Cuts

- **User accounts / history** — No auth or DB in v1; sessions are ephemeral. History would require both.
- **Streaming HTML output** — Genkit structured output requires the full JSON response before returning; streaming raw text would bypass Zod validation.
- **Multi-step refinement** — One-shot generation only; a refinement loop would require conversation history state and multi-turn prompting.
- **Export to React/Vue component** — Single-file HTML is the simplest portable format; framework export adds significant complexity.
- **Template / example gallery** — Useful UX addition but deferred to v2; doesn't affect core generation capability.

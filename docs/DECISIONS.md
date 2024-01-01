# Engineering Decisions — Prompt2App

<!-- PURPOSE OF THIS FILE
     This is not user documentation. This is for technical interviewers
     and senior engineers who want to understand WHY the system is built
     the way it is. Every entry should answer a question an interviewer
     might ask.
-->

---

## Decision 1 — Genkit + Gemini 2.0 Flash over direct API calls or other providers

**Context:** The project needed to call an LLM server-side, enforce a structured JSON output schema, and support a local dev workflow for iterating on prompts. Options included: raw `fetch` to the OpenAI or Anthropic API, LangChain, or Google's Firebase Genkit framework.

**Decision:** Firebase Genkit with `@genkit-ai/googleai` and `googleai/gemini-2.0-flash`.

**Reason:** Genkit provides a first-class structured output primitive (Zod schema enforcement on the model call) that eliminates the need for manual JSON parsing or prompt-engineering tricks to coerce output format. The `genkit start` dev server gives a local UI to inspect and replay flows without deploying. Gemini 2.0 Flash handles long HTML output (often 200–600 lines) without truncation at realistic token limits, and returns responses faster than GPT-4o-class models for this generation size.

**Tradeoff:** Genkit is a younger framework with less community documentation than LangChain. Lock-in to Google's AI ecosystem; switching providers requires replacing the plugin and re-testing structured output behaviour.

---

## Decision 2 — Single-file HTML output rendered via `iframe srcDoc`

**Context:** The app needs to show a working, interactive preview of the generated app instantly — without spinning up a server to execute code, without a remote sandbox (like CodeSandbox's API), and without shipping a complex runtime.

**Decision:** Instruct Gemini to produce a complete self-contained HTML file (inline CSS + JS); render it via `<iframe srcDoc={generatedCode}>`.

**Reason:** `srcDoc` rendering is zero-latency beyond the AI call itself — the browser parses and runs the HTML directly, no network request needed. Users can download this file and open it in any browser, forever, with no dependency on Prompt2App being live. It also makes the AI's task well-defined: "produce one HTML file" is a cleaner, more testable constraint than "produce a React app."

**Tradeoff:** Generated apps are limited to vanilla JS and browser-native APIs. npm packages and server-side features are not available unless the generated code loads them from a CDN, which is fragile. `localStorage` also does not work in the sandboxed iframe because `allow-same-origin` is omitted for security (see Decision 4).

---

## Decision 3 — Next.js Server Action instead of a REST `/api/` route

**Context:** The Genkit flow must run server-side to keep `GOOGLE_GENAI_API_KEY` out of the browser. The standard Next.js approach is to create a `POST /api/generate` route handler. An alternative is a Server Action.

**Decision:** `generateApp` is exported from `app-generator.ts` with `'use server'` — a Next.js Server Action called directly from the client component.

**Reason:** Eliminates a separate route file and the corresponding `fetch` + `JSON.stringify` + response parsing boilerplate. The Server Action is fully type-safe end-to-end: `GenerateAppInput` and `GenerateAppOutput` are shared TypeScript types, so a type mismatch is a compile error rather than a runtime surprise. The calling code reads like a normal async function call.

**Tradeoff:** Server Actions are a relatively new pattern. They are harder to test with `curl` or Postman than a REST route, and error stack traces are less transparent during debugging. The hidden RPC mechanism can confuse engineers unfamiliar with the App Router mental model.

---

## Decision 4 — `sandbox="allow-scripts allow-forms allow-popups"` without `allow-same-origin`

**Context:** The generated HTML runs arbitrary JavaScript produced by an AI model. Without sandboxing, that code has full access to the host page's DOM, cookies, and localStorage — a meaningful XSS surface even in a portfolio demo.

**Decision:** The preview `<iframe>` explicitly omits `allow-same-origin` from its sandbox attribute.

**Reason:** Without `allow-same-origin`, the iframe is treated as a cross-origin document: its scripts cannot read or write the parent page's DOM, access `document.cookie`, or reach the host's `localStorage`. This prevents even cleverly-crafted AI output from exfiltrating session data or injecting malicious content into the surrounding UI.

**Tradeoff:** Generated apps themselves cannot persist data via `localStorage` or `sessionStorage`, because those APIs require same-origin access. The system prompt documents this limitation and instructs the model to handle it gracefully (e.g., treat storage as session-scoped), but some prompts will produce apps that appear broken in the preview.

---

## What I'd do differently in v2

- **Add response streaming** — Genkit structured output requires the full JSON before returning, which means the user stares at a spinner for 10–20s. In v2, I'd explore streaming the raw HTML tokens and assembling the iframe progressively, accepting that Zod validation would move to post-stream.
- **Add prompt history in localStorage** — The current stateless design means every page refresh loses previous generations. A simple localStorage array of `{ prompt, code, timestamp }` objects would dramatically improve usability with no backend needed.
- **Add a fallback model** — Currently, if Gemini is down or rate-limited, the app just fails. A fallback to Gemini 1.5 Flash or a different provider would improve reliability for a live demo.

---

## Explicit non-decisions (deferred to v2)

| Feature | Why deferred |
|---|---|
| User accounts + saved projects | Requires auth + database; adds significant infrastructure for an MVP whose primary value is the one-shot generation experience |
| Multi-step refinement / chat | Needs conversation history state and multi-turn prompting; complicates the UI significantly; one-shot covers the core use case |
| Generated app hosting | Prompt2App is a generator, not a platform; hosting adds backend complexity (storage, compute, abuse prevention) out of scope for v1 |
| Streaming HTML output | Genkit's structured output contract requires a complete JSON response; streaming raw tokens bypasses schema validation |

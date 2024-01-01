# Prompt2App — Product Requirements Document

**Status:** Final
**Owner:** Tanish Poddar
**One-liner:** Describe any web app in plain English (or by voice) and get a fully working, downloadable HTML app in seconds, powered by Google Gemini.

---

## 1. Problem

Building a quick interactive prototype — a calculator, a planner, a quiz, a timer — requires writing HTML, CSS, and JavaScript from scratch, which is a barrier for non-developers and time-consuming even for experienced engineers. Existing tools either require design skills (Figma), coding fluency (CodePen), or produce static mockups that aren't actually functional. There is no zero-barrier tool that takes a plain English description and immediately produces a working, runnable app the user can download and use anywhere.

---

## 2. Goals (v1 / MVP)

1. Accept a natural language text prompt describing the desired web app.
2. Accept voice input via the browser's Web Speech API as an alternative to typing.
3. Call Google Gemini via Genkit server-side and return a complete, self-contained HTML app.
4. Render the generated app as a live interactive preview inside a sandboxed iframe.
5. Expose the raw generated HTML in a "Code" tab for inspection.
6. Allow the user to download the generated HTML as a standalone `.html` file.
7. Allow the user to regenerate (re-run the same prompt) for a different result.
8. Deployed with a live, publicly accessible demo URL.

---

## 3. Non-Goals (explicit scope cuts)

- **User accounts or saved history** — The tool is stateless by design for v1; adding auth and a DB is a significant scope increase with limited MVP benefit.
- **Multi-step prompt refinement** — One-shot generation covers the core use case; a refinement loop requires conversation state management.
- **Template / starter prompt library** — Useful UX but not required for the core value proposition; deferred to v2.
- **Export to React / Vue component format** — Single-file HTML is universally runnable; framework-specific export adds complexity without clear MVP need.
- **Generated app hosting** — Users download and self-host; Prompt2App is a generator, not a hosting platform.

---

## 4. Users

**Primary:** Developers and students who want a working interactive prototype from a natural language description — without writing any HTML/CSS/JS.

**Secondary:** Non-technical users (designers, product managers, founders) who want to demonstrate an app idea; recruiters evaluating this as a portfolio piece and running it on their own prompts.

---

## 5. User Stories

1. *As a developer,* I type a description of my app idea so that I immediately get a working HTML prototype I can iterate on.
2. *As a user who prefers speaking,* I use the voice input button so that I can describe my app without typing.
3. *As a user,* I see a live interactive preview of the generated app so that I can verify it works before downloading.
4. *As a technically curious user,* I switch to the Code tab so that I can read and learn from the generated HTML.
5. *As a user,* I click "Save HTML" so that I can download the file and host or share it independently.
6. *As a user,* I click "Regenerate" so that I can get a different version of the app if the first generation doesn't match my intent.
7. *As a user,* I get a clear error message if generation fails so that I know what went wrong and can try again.

---

## 6. Functional Requirements

### 6.1 Prompt Input

- A multi-line textarea accepts the user's app description.
- A voice input button toggles browser Speech Recognition (Web Speech API, `en-US`, non-continuous).
- Transcribed speech appends to the existing textarea content.
- If the textarea is empty when "Create App" is clicked, a destructive toast is shown and generation does not start.
- Voice button is disabled (with explanatory text) on browsers that do not support the Speech Recognition API.

### 6.2 AI Generation

- On submit, the prompt is sent to the `generateApp` Next.js Server Action.
- The Server Action calls Genkit's `generateAppFlow`, which invokes Google Gemini 2.0 Flash with a structured output schema.
- A loading spinner replaces the results area during generation.
- On success, the generated HTML string is stored in component state.
- On failure (network error, API error, invalid output), a descriptive destructive toast is shown.

### 6.3 Preview

- Generated HTML is rendered in an `<iframe srcDoc>` with `sandbox="allow-scripts allow-forms allow-popups"` (no `allow-same-origin`).
- The preview iframe is 500px tall and fills the container width.
- A tabbed interface provides a "Preview" tab (default) and a "Code" tab.
- The Code tab displays the raw HTML in a scrollable, monospace pre block.

### 6.4 Actions

- **Regenerate** — re-invokes `generateApp` with the same current prompt; replaces the existing preview.
- **Clear** — removes the generated code from state, hiding the preview section.
- **Save HTML** — creates a Blob from the HTML string, triggers a browser download of `prompt2app_preview.html`.

---

## 7. Non-Functional Requirements

- **Latency:** Generation time is bounded by Gemini API response time (typically 5–20s). No additional server-side processing delay.
- **Security:** `GOOGLE_GENAI_API_KEY` lives in `.env` (gitignored), accessed only inside the Server Action — never exposed to the browser. Generated app code runs in a sandboxed iframe with no same-origin access.
- **Cost:** One Gemini API call per generation. No polling, background jobs, or per-page-load AI calls. Cost is proportional to usage.
- **Reliability:** All AI calls wrapped in try/catch. Generation failure surfaces a user-facing error rather than a silent broken state.
- **Accessibility:** Fully keyboard-navigable. ARIA labels on interactive controls. Mobile-responsive layout (single-column on small screens).

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| Live demo reliability | First visit → generated app working within one attempt |
| Generation success rate | >90% of well-formed prompts return working HTML |
| Voice input usability | Works correctly in Chrome on desktop |
| Preview interactivity | Generated apps respond to user interactions inside the iframe |

---

## 9. Risks & Open Questions

- **Gemini rate limits on free tier** — A spike in demo traffic could exhaust the API quota. Mitigated by on-demand calls only (no per-load AI calls), but no fallback model is configured.
- **Generated HTML quality variance** — Gemini may produce non-functional JS for complex prompts. Mitigated by the detailed system prompt with explicit constraints and a worked example.
- **Voice input browser support** — Web Speech API is Chrome-first; Firefox and Safari support is limited or behind flags. Mitigated by disabling the button and showing a message on unsupported browsers.
- **Open question:** Should the iframe height be user-adjustable or auto-sized to content height? Currently fixed at 500px.

---

## 10. v2 Candidates

- **Prompt history** — Save past generations to localStorage so users can revisit without re-running; requires no backend but adds local state complexity.
- **Multi-step refinement** — "Improve this app: add dark mode" style follow-ups using conversation history.
- **Model selection** — Let users choose Gemini 1.5 Pro (higher quality) vs Gemini 2.0 Flash (faster) per generation.
- **Export to React component** — Wrap the generated HTML/JS in a React component scaffold for easier integration.
- **Starter prompt gallery** — Curated example prompts (calculator, todo list, quiz, timer) to reduce blank-page friction.

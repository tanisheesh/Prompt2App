<p align="center">
  <img src="src/app/favicon.ico" width="64" height="64" alt="Prompt2App icon">
</p>

<h1 align="center">Prompt2App</h1>

<p align="center">
  <strong>Describe any web app in plain English — get a fully working, downloadable HTML app in seconds.</strong>
</p>

<p align="center">
  <a href="https://prompt2app.tanisheesh.in">
    <img src="https://img.shields.io/badge/live_demo-9400D3-9400D3?style=flat-square" alt="Live Demo">
  </a>
  <img src="https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=flat-square&logo=google&logoColor=white" alt="Google Gemini">
  <img src="https://img.shields.io/badge/Genkit-FF6F00?style=flat-square&logo=firebase&logoColor=white" alt="Firebase Genkit">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">
  <img src="https://img.shields.io/badge/license-GPL--3.0-9400D3?style=flat-square" alt="License">
</p>

---

## What is Prompt2App?

Prompt2App turns a plain English (or spoken) description into a fully functional, self-contained HTML app — instantly. You type (or say) something like "a daily planner with voice reminders" and the app calls Google Gemini 2.0 Flash, which writes the complete HTML, CSS, and JavaScript. The result renders live in an iframe so you can interact with it immediately, and you can download it as a standalone `.html` file that runs anywhere — no server, no framework, no dependencies. The alternative is opening a code editor.

> **Live demo →** [prompt2app.tanisheesh.in](https://prompt2app.tanisheesh.in)

---

## What you get

- **AI-powered generation** — Google Gemini 2.0 Flash writes complete, functional single-file apps from a natural language prompt; not mockups, actual working code with real browser APIs.
- **Voice input** — Describe your app by speaking; the Web Speech API transcribes and appends to your prompt, no keyboard required.
- **Live interactive preview** — Generated apps render instantly in a sandboxed iframe; click buttons, fill forms, and interact with the output before downloading.
- **Code view + download** — Inspect the raw HTML in a scrollable code tab, then download `prompt2app_preview.html` for standalone use.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router) · React 18 · Tailwind CSS 3 · Radix UI (shadcn/ui) |
| AI | Google Gemini 2.0 Flash via Firebase Genkit (`genkit` · `@genkit-ai/googleai`) |
| Language | TypeScript |
| Icons | Lucide React |
| Hosting | Vercel |

---

## Engineering Decisions

**Why Genkit over a raw Gemini API call?**
Genkit provides first-class structured output enforcement via Zod schemas — the model is constrained to return `{ code: string }` rather than free-form text, eliminating JSON parsing and regex extraction. It also ships a local dev UI (`genkit start`) for iterating on prompts without deploying.

**Why a single self-contained HTML file?**
It is the most universally runnable format — no npm install, no server, no framework version conflicts. The user downloads one file and opens it in any browser forever. It also gives the AI a clean, well-scoped task: "produce one complete HTML file" is more reliable than "produce a multi-file React project."

**Why a Next.js Server Action instead of an API route?**
The Server Action pattern eliminates a separate route file and the `fetch` + JSON boilerplate. It is fully type-safe end-to-end — `GenerateAppInput` and `GenerateAppOutput` are shared TypeScript types, so type mismatches are compile errors. The API key never leaves the server.

**Why omit `allow-same-origin` from the preview iframe?**
Generated code is arbitrary AI output. Without `allow-same-origin`, the iframe's scripts cannot access the host page's DOM, cookies, or localStorage, limiting the XSS surface regardless of what the model produces.

---

## Docs

| Document | Description |
|---|---|
| [PRD](docs/PRD.md) | Product requirements — goals, user stories, non-goals |
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, component breakdown |
| [Decisions](docs/DECISIONS.md) | Every major technical decision and why |
| [Setup](docs/SETUP.md) | Local dev setup, env vars, deployment |

---

## Author

**Tanish Poddar** — [tanisheesh.in](https://tanisheesh.in) · [LinkedIn](https://linkedin.com/in/tanisheesh) · [GitHub](https://github.com/tanisheesh)

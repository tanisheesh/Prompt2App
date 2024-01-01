# Local Setup — Prompt2App

> **Just want to try it?** Use the live demo at [prompt2app.tanisheesh.in](https://prompt2app.tanisheesh.in) — no setup needed.
> This guide is for running Prompt2App locally or self-hosting it.

---

## Prerequisites

- Node.js 20+
- npm (bundled with Node.js)
- A Google AI Studio API key (`GOOGLE_GENAI_API_KEY`)

---

## 1. Clone and install

```bash
git clone https://github.com/tanisheesh/Prompt2App
cd Prompt2App
npm install
```

---

## 2. Environment variables

Create a `.env.local` file in the project root:

```bash
# .env.local
GOOGLE_GENAI_API_KEY=your_api_key_here
```

| Variable | Where to get it |
|---|---|
| `GOOGLE_GENAI_API_KEY` | [Google AI Studio](https://aistudio.google.com) → "Get API Key" → Create API Key |

> The `.env*` pattern is gitignored — your key will not be committed.

---

## 3. Run locally

```bash
npm run dev
```

Prompt2App will be running at `http://localhost:9002`.

---

## 4. Genkit dev server (optional)

The Genkit development server lets you inspect, test, and replay AI flows in a local UI — useful if you are modifying `src/ai/flows/app-generator.ts`.

```bash
# Start Genkit dev server (one-shot)
npm run genkit:dev

# Start with hot-reloading (recommended during flow development)
npm run genkit:watch
```

The Genkit dev UI opens at `http://localhost:4000`.

---

## 5. Deploy to production (Vercel)

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. In the Vercel project dashboard → Settings → Environment Variables, add:
   - `GOOGLE_GENAI_API_KEY` = your production API key
4. Vercel auto-deploys on every push to `main`. No database migrations needed.

---

## Known local-only limitations

- Voice input requires a secure context in some browsers. Chrome allows `localhost` without HTTPS; other browsers may block the Web Speech API.
- Generated apps that use browser Notification API or camera/microphone APIs may require HTTPS even in the preview iframe — they will fail silently on `http://localhost`.
- The preview `<iframe>` omits `allow-same-origin`, so generated apps cannot read/write `localStorage`. This is intentional (security), not a local-only issue.

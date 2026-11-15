# Local Setup — Prompt2App

> **Just want to try it?** Use the live deployment at [https://prompt2app.tanisheesh.in](https://prompt2app.tanisheesh.in) — zero setup needed.
> This guide covers running **Prompt2App** locally, verifying builds, and troubleshooting common local issues.

---

## Prerequisites & Versions

- **Node.js `20+`** (`22.x` recommended, matches CI)
- **`pnpm` `10+`** (enable via `corepack enable`)
- A **Groq Cloud API key** (`GROQ_API_KEY`) — free tier works out of the box

*(Prompt2App is intentionally stateless on the server and requires no Docker, Postgres, Redis, or seed scripts.)*

---

## 1. Clone & Install

```bash
git clone https://github.com/tanisheesh/Prompt2App
cd Prompt2App
pnpm install --frozen-lockfile
```

---

## 2. Environment Variables

Copy `.env.example` to `.env.local` and add your Groq API key:

```bash
cp .env.example .env.local
```

| Variable | Type / Format | Required | Scope | Local Default / Source |
|---|---|---|---|---|
| `GROQ_API_KEY` | String (`gsk_...`) | ✅ | Server-only | [console.groq.com/keys](https://console.groq.com/keys) → Create API Key |

> Never commit `.env` or `.env.local`, and never expose server secrets with `NEXT_PUBLIC_`.

---

## 3. Run Locally

```bash
pnpm dev
```

Prompt2App runs on `http://localhost:9002`:
- `/` — Product landing page & composer
- `/studio` — Full-screen interactive App Builder Studio
- `/api/generate`, `/api/enhance`, `/api/transcribe` — Server Route Handlers

---

## 4. Run Verification & Checks

Run the exact verification commands enforced by CI before committing:

```bash
pnpm run typecheck   # Runs next typegen && tsc --noEmit (TypeScript 7 strict mode)
pnpm run build       # Runs next build (Turbopack production bundle)
```

*(Note: Automated `lint` and unit/E2E `test` scripts are not yet configured in `package.json`.)*

If `coderabbit` CLI is installed locally, optionally run a pre-PR review:

```bash
coderabbit review --agent --uncommitted
```

---

## 5. Known Local-Only Limitations

- **Voice dictation requires a secure context:** `navigator.mediaDevices.getUserMedia` works on `http://localhost:9002` and `https://`, but fails if accessed over a plain LAN IP (`http://192.168.x.x:9002`).
- **Ephemeral storage inside Studio preview:** Because `<iframe srcDoc>` omits `allow-same-origin`, generated apps run against an in-memory `Storage` polyfill inside Studio and reset on preview refresh; downloaded `.html` files use real persistent browser `localStorage`.
- **Edge security headers:** Headers defined in `vercel.json` apply on Vercel edge responses, not `next dev`.

---

## 6. Troubleshooting

| Symptom / Exact Error | Root Cause | Fix |
|---|---|---|
| `GROQ_API_KEY is not configured. Add GROQ_API_KEY to your .env.local file.` (`500`) | Missing or blank `GROQ_API_KEY` in `.env.local` | Add a valid key from `console.groq.com/keys` to `.env.local` and restart `pnpm dev` |
| `Microphone permission needed` / mic fails on LAN URL | Browser denied mic access or non-HTTPS LAN origin | Open `http://localhost:9002` (or HTTPS) and allow microphone permission |
| `Recording was too short. Please speak for at least 1 second.` (`400`) | Audio file under `300 B` (server) / `400 B` (client) | Hold recording for > 1s and verify working microphone input |
| `Audio recording exceeds the 15 MB size limit.` (`413`) | Spoken prompt exceeded `MAX_AUDIO_BYTES` (`15 MB`) | Keep voice recordings shorter and split long specs |
| `Current code is too large to refine in a single request.` (`400`) | `currentCode` exceeded `250,000` characters | Start a fresh prompt or trim generated code size before refining |
| Port `9002` already in use | Another process is bound to `9002` | Stop the other process or run `pnpm exec next dev -p 3000` |

---

## 7. Deploy to Production

See [DEPLOY.md](DEPLOY.md) for Vercel deployment, custom domain setup, smoke checks, and rollback steps.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>

# Local Setup — Prompt2App

> **Just want to try it?** Use the live demo at [https://prompt2app.tanisheesh.in](https://prompt2app.tanisheesh.in) — no setup needed.
> This guide is for running Prompt2App locally or self-hosting it.

---

## Prerequisites

- Node.js 20+ (Node 22 recommended)
- `pnpm` 9+ (`corepack enable`)
- A Groq Cloud API key (`GROQ_API_KEY`)

---

## 1. Clone and install

```bash
git clone https://github.com/tanisheesh/Prompt2App
cd Prompt2App
pnpm install
```

---

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your Groq API key:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) → Create API Key |

---

## 3. Run locally

```bash
pnpm dev
```

Prompt2App will be running at `http://localhost:9002` (Landing Page at `/` and Studio Workbench at `/studio`).

Verify type safety and production build locally before committing:

```bash
pnpm typecheck
pnpm build
```

---

## 4. Deploy to production

See [DEPLOY.md](DEPLOY.md) for production deployment, custom domain, and rollback steps.

---

## Known local-only limitations

- Voice dictation (`MediaRecorder` / `navigator.mediaDevices.getUserMedia`) requires a secure context: `http://localhost:9002` works in all browsers, but accessing a LAN IP (`http://192.168.x.x:9002`) without HTTPS will block microphone access.
- Inside the Studio preview `<iframe>`, `localStorage` uses an in-memory sandbox polyfill (`src/lib/sandbox.ts`) so state resets on preview refresh; downloaded `.html` files use persistent browser `localStorage`.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>

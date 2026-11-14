# Deploying Prompt2App

> **Live:** [https://prompt2app.tanisheesh.in](https://prompt2app.tanisheesh.in) · **Host:** Vercel · **Auto-deploy:** on push to `main`

For local development, see [SETUP.md](SETUP.md).

---

## 1. Architecture in production

| Piece | Runs on | Notes |
|---|---|---|
| Web app (`/` & `/studio`) | Vercel | Next.js 15 App Router static + dynamic routes |
| Streaming AI endpoints (`/api/*`) | Vercel Functions | Node.js runtime (`maxDuration = 60` on `/api/generate`) |
| DNS | GoDaddy | `prompt2app.tanisheesh.in` → CNAME to `cname.vercel-dns.com` |

---

## 2. Environment variables

Set these in the Vercel dashboard (never commit them). Names and sources are in [`.env.example`](../.env.example).

| Variable | Required | Where it's set |
|---|---|---|
| `GROQ_API_KEY` | ✅ | Vercel → Project → Settings → Environment Variables |

> After changing an env var, **redeploy**. Running deployments don't pick up new values.

---

## 3. First-time deploy (Vercel)

1. [vercel.com/new](https://vercel.com/new) → import `tanisheesh/Prompt2App`
2. Framework preset: `Next.js` · Root directory: `./` · Install command: `pnpm install`
3. Add `GROQ_API_KEY` from section 2
4. Deploy. Every push to `main` deploys to production, and every PR gets a preview URL.

---

## 4. Custom domain

`prompt2app.tanisheesh.in` is wired with the setup toolkit:

```powershell
.\scripts\setup-subdomain.ps1 -Subdomain "prompt2app" -Platform Vercel -VercelProject "prompt2app"
```

Manual fallback: add `prompt2app.tanisheesh.in` in the Vercel project's Domains tab, then create a GoDaddy CNAME `prompt2app` → `cname.vercel-dns.com`. HTTPS certificates are issued automatically once DNS resolves (2–10 min).

---

## 5. Verify a deploy

- [ ] `https://prompt2app.tanisheesh.in` loads with no console errors
- [ ] Entering a prompt and clicking **Generate** streams live HTML into `/studio`
- [ ] Switching between Desktop, Tablet (`768px`), and Mobile (`390px`) resizes the preview frame
- [ ] **Enhance**, **Voice**, and **Download HTML** work end-to-end

---

## 6. Rollback

| Host | How |
|---|---|
| Vercel | Dashboard → Deployments → pick the last good one → **Promote to Production** (or `vercel rollback`) |

After rolling back, note it in a commit or PR so the next push doesn't silently re-ship the broken version.

---

## 7. Monitoring & logs

- **Logs:** Vercel → Project → Logs (inspect `/api/generate`, `/api/enhance`, `/api/transcribe` function invocations)
- **Dependencies:** Dependabot opens weekly update PRs and a maintenance report is generated every Monday (see `.github/workflows/`)

---

## Known production limitations

- Groq API rate limits apply per account plan; `/api/generate` automatically cascades across `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, and `qwen/qwen3.8-27b` if a single model throttles.
- Vercel Hobby tier caps serverless streaming functions at 60 seconds (`maxDuration = 60`), which comfortably covers Groq LPU generation speeds (`1.5–5s` typical).

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>

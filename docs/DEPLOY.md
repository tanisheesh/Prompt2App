# Deploying Prompt2App

> **Live:** [https://prompt2app.tanisheesh.in](https://prompt2app.tanisheesh.in) · **Host:** Vercel · **Auto-deploy:** on push to `main`

For local development, see [SETUP.md](SETUP.md).

---

## 1. Production Topology & Resource Limits

| Component | Host / Service | Region & Runtime | Configured Limits / Quotas |
|---|---|---|---|
| Web App (`/` & `/studio`) | Vercel | Node.js `22.x` · Next.js `16.4.6` App Router | Static prerender + dynamic Studio; edge security headers via `vercel.json` |
| Streaming AI Routes (`/api/*`) | Vercel Functions | Node.js runtime (`src/app/api/*/route.ts`) | `maxDuration = 60` (`/api/generate`), `30` (`/api/enhance`, `/api/transcribe`) |
| LLM & Speech Inference | Groq Cloud API | HTTPS (`api.groq.com`) | `55s` SDK timeout · `maxRetries: 2` · 3-model fallback chain |
| Client Workspace Persistence | Browser `localStorage` | End-user device | `0` server storage; `25` projects × `15` versions client-side |
| DNS & TLS | GoDaddy → Vercel | `prompt2app.tanisheesh.in` | CNAME `cname.vercel-dns.com` + automatic Vercel TLS |

---

## 2. Production Environment Variables

Configure secrets in the Vercel Project Dashboard (encrypted at rest; never commit). Full key list is in [`.env.example`](../.env.example).

| Variable | Required | Host Location | Rotation / Sensitivity |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ | Vercel → Project → Settings → Environment Variables (`Production` & `Preview`) | High — server-only (`src/lib/groq.ts`), never `NEXT_PUBLIC_` |

> Changing an env var does **not** update running deployments — trigger a redeploy after editing environment variables.

---

## 3. First-Time Deploy

### Option A: Vercel (Primary)

1. [vercel.com/new](https://vercel.com/new) → import `tanisheesh/Prompt2App`.
2. Framework preset: `Next.js` · Root directory: `./` · Install command: `pnpm install --frozen-lockfile`.
3. Add `GROQ_API_KEY` from Section 2 and deploy.
4. Apply production runtime, security, and region optimization via setup-toolkit:
   ```powershell
   ..\setup-toolkit\scripts\setup-vercel-project.ps1 -Project "prompt2app" -RepoPath . -Region "bom1" -IgnoreDocsOnlyBuilds
   ```

### Option B: Self-Host Node Server

```bash
pnpm install --frozen-lockfile
pnpm run build
GROQ_API_KEY=<your_key> pnpm start
```

---

## 4. Custom Domain & Security Headers

`prompt2app.tanisheesh.in` is wired via:

```powershell
..\setup-toolkit\scripts\setup-subdomain.ps1 -Subdomain "prompt2app" -Platform Vercel -VercelProject "prompt2app"
```

- **Manual DNS fallback:** Add `prompt2app.tanisheesh.in` in Vercel → Project → Domains, then set GoDaddy CNAME `prompt2app` → `cname.vercel-dns.com` (TTL 600s; propagation 2–10 min).
- **Security headers (`vercel.json`):** Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, and `Permissions-Policy: camera=(), microphone=(self), geolocation=()`. Keeping `microphone=(self)` is mandatory so Whisper voice recording works on `/studio` while staying blocked inside opaque-origin preview iframes.

---

## 5. Post-Deploy Smoke Verification

Run immediately after production deploys:

```bash
# 1. Verify landing page and Studio return HTTP 200
curl -fsS -o /dev/null -w "/ -> %{http_code}\n" https://prompt2app.tanisheesh.in/
curl -fsS -o /dev/null -w "/studio -> %{http_code}\n" https://prompt2app.tanisheesh.in/studio

# 2. Verify security headers are active at the Vercel edge
curl -sI https://prompt2app.tanisheesh.in | grep -iE "x-frame-options|x-content-type-options|strict-transport-security|referrer-policy|permissions-policy"

# 3. Verify Zod input validation rejects invalid payloads (expect 400)
curl -s -o /dev/null -w "POST /api/generate invalid -> %{http_code}\n" \
  -X POST https://prompt2app.tanisheesh.in/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a"}'
```

- [ ] `https://prompt2app.tanisheesh.in` loads on mobile (`390px`) and desktop (`1280px`) with zero console errors
- [ ] Entering a prompt streams live HTML into `/studio` and renders interactively in `<iframe srcDoc>`
- [ ] Switching `Desktop`, `Tablet (768px)`, and `Mobile (390px)` resizes the preview stage cleanly
- [ ] **Enhance**, **Voice** (`MediaRecorder`), and **Download HTML** work end-to-end

---

## 6. Rollback Procedure

| Layer | Rollback Action |
|---|---|
| **Vercel** | Dashboard → Deployments → pick last known good deployment → **Promote to Production** (or `vercel rollback`) |

> Always note any manual rollback (target commit SHA + reason) in a commit or PR so the next push to `main` does not silently re-ship the broken version.

---

## 7. Incident & Quota Runbooks

| Incident | Immediate Action |
|---|---|
| **Groq `429` / `503` spike** | Verify fallback cascade in Vercel logs (`/api/generate` cycles `gpt-oss-120b` → `gpt-oss-20b` → `qwen3.8-27b`); check Groq status/tier quota or rotate key |
| **Voice dictation blocked in browser** | Inspect `Permissions-Policy` response header on `/` and `/studio`; ensure `microphone=(self)` (never `microphone=()`) is active in `vercel.json` |
| **Suspected `GROQ_API_KEY` leak** | Revoke leaked key at `console.groq.com/keys` → update `GROQ_API_KEY` in Vercel Env Vars → trigger redeploy → verify Gitleaks + Secret Scanning clear |
| **Client `localStorage` error reports** | Inspect `src/lib/sandbox.ts` polyfill or `src/lib/storage.ts` quota pruning; clear corrupted `prompt2app_projects_v2` in DevTools if local |

---

## 8. Monitoring & Automated Maintenance

- **Logs:** Vercel → Project → Logs (inspect `/api/generate`, `/api/enhance`, `/api/transcribe` durations, fallback warnings, and errors).
- **Automated Hygiene:** Renovate (`Yantra [bot]`), CodeQL, Gitleaks Secret Scan, Dependency Review, PR Labeler, and weekly Maintenance Report run via `.github/workflows/`.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>

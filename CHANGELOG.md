# Changelog

All notable changes to **Prompt2App** are documented here.

---

## [Unreleased]

### 🔒 Security
- Added `vercel.json` HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, and `Permissions-Policy` scoped to `microphone=(self)`)
- Added CodeQL SAST scanning, Gitleaks secret scanning, and PR dependency review gates in GitHub Actions
- Cleared placeholder dummy token in `.env.example` and expanded `.gitignore` coverage for `.env` variants and `brag-output/`

### 📚 Docs
- Added runtime `AGENTS.md` contract and upgraded `README.md`, `PRD.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `SETUP.md`, and `DEPLOY.md` to v2 engineering standards with Mermaid diagrams, API contracts, and scale ceilings

---

## [2.0.0] — 2026-11-15

### ✨ Added
- Real-time streaming Groq LPU generation endpoint (`POST /api/generate`) supporting `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, and `openai/gpt-oss-20b` with automatic model fallback and upstream abort cancellation
- Dedicated product Landing Page (`/`) and full-screen Studio Workbench (`/studio`)
- Multi-turn conversational app refinement with immutable version snapshots (`v1`, `v2`, `v3`...) persisted in browser `localStorage`
- Universal voice dictation (`POST /api/transcribe`) powered by `MediaRecorder` and Groq `whisper-large-v3-turbo`
- 1-click AI prompt specification enhancer (`POST /api/enhance`)
- Responsive device frame switcher (`Desktop 100%`, `Tablet 768px`, `Mobile 390px`), `Preview / Code / Split` views, fullscreen mode, and standalone browser tab launcher
- Self-healing sandboxed iframe runtime (`src/lib/sandbox.ts`) with injected `localStorage` polyfill, empty-anchor navigation guard, and 1-click AI runtime error patching
- Full SEO & metadata suite (`icon.svg`, `apple-icon`, `opengraph-image`, `manifest.webmanifest`, `robots.txt`, `sitemap.xml`, and JSON-LD `SoftwareApplication` schema)

### 🎊 Improved
- Pure obsidian dark design system with self-hosted `Inter` and `JetBrains Mono` fonts (`next/font/google`) and custom dark scrollbars across native containers, Radix scroll areas, and preview iframes
- Quota-safe `localStorage` project manager that automatically prunes oldest snapshots if browser storage reaches capacity

### 🐛 Fixed
- Preserved inline JavaScript template literals in `cleanHtmlOutput()` by restricting markdown code fence stripping to outer document boundaries
- Prevented microphone hardware track leaks on component unmount and added `audio/mp4` recording fallback for Safari
- Fixed preview iframe height collapse across Desktop, Tablet, and Mobile frames using strict `100dvh` flex sizing

### 🔒 Security
- Isolated AI-generated scripts inside cross-origin `<iframe srcDoc>` without `allow-same-origin` and added Zod payload/audio size limits on all API routes

### 👆 Dependencies
- Upgraded framework stack to Next.js `16.4.6`, React `19.3.1`, TypeScript `7.0.2`, Zod `4.6.7`, and `lucide-react` `1.72.0`

### 💀 Removed
- Removed legacy Firebase Genkit (`genkit`, `@genkit-ai/*`, `firebase`) dependencies and 28 unused template UI primitives/packages

---

## [1.0.0] — 2025-06-01

### ✨ Added
- Initial Next.js 15 single-page prompt-to-HTML generator using Google Gemini 2.0 Flash via Firebase Genkit
- Sandboxed live iframe preview, raw HTML code tab, Web Speech API voice input, and `.html` file download

---

[Unreleased]: https://github.com/tanisheesh/Prompt2App/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/tanisheesh/Prompt2App/releases/tag/v2.0.0
[1.0.0]: https://github.com/tanisheesh/Prompt2App/releases/tag/v1.0.0

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>

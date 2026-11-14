'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandLogo, GitHubMark } from '@/components/brand-logo';
import { PromptComposer } from '@/components/studio/prompt-composer';
import { StarterTemplates } from '@/components/studio/starter-templates';
import { STARTER_TEMPLATES } from '@/lib/prompts';
import { DEFAULT_MODEL_ID } from '@/lib/groq';
import { loadProjects } from '@/lib/storage';
import type { GroqModelId, ProjectItem, StarterTemplate } from '@/lib/types';
import {
  ArrowUpRight,
  ChevronDown,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Code2,
} from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'Does the downloaded file require Node.js, npm, or a backend server?',
    a: 'No. Prompt2App outputs a single self-contained .html document with inline styles and scripts. You can double-click it to run locally in any browser, email it, or drop it onto Netlify, Vercel, or GitHub Pages.',
  },
  {
    q: 'How do follow-up edits and version history work?',
    a: 'Inside the Studio workspace, every prompt you send creates an immutable snapshot (v1, v2, v3...). You can ask for layout tweaks, dark mode, or new features, and switch back to any earlier version in one click.',
  },
  {
    q: 'Is my code sent to a public feed or shared with others?',
    a: 'No. Unlike public prompt galleries, your generated apps and version timelines are stored strictly in your own browser localStorage.',
  },
  {
    q: 'Which models are available for generation and voice input?',
    a: 'You can switch between OpenAI GPT-OSS 120B (best reasoning & complex UI), Qwen 3.8 27B (strong layout & styling), and GPT-OSS 20B (~1,000 tok/s speed), plus Whisper Large V3 Turbo for voice dictation.',
  },
];

export default function LandingPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] =
    useState<GroqModelId>(DEFAULT_MODEL_ID);
  const [savedProjects, setSavedProjects] = useState<ProjectItem[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [demoTab, setDemoTab] = useState<'preview' | 'code'>('preview');

  useEffect(() => {
    setSavedProjects(loadProjects());
  }, []);

  const handleLaunchStudio = (customPrompt?: string) => {
    const targetPrompt = (customPrompt ?? prompt).trim();
    if (!targetPrompt) return;
    const params = new URLSearchParams({
      prompt: targetPrompt,
      model: selectedModel,
    });
    router.push(`/studio?${params.toString()}`);
  };

  const handleStarterSelect = (tpl: StarterTemplate, buildImmediately = false) => {
    if (buildImmediately) {
      handleLaunchStudio(tpl.prompt);
    } else {
      setPrompt(tpl.prompt);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-clip flex flex-col bg-background text-foreground">
      {/* =====================================================
          CLEAN, REFINED NAVBAR
          Brand left · Subtle section links · Single GitHub button right
          ===================================================== */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-7 min-w-0">
            <Link href="/" className="focus:outline-none shrink-0">
              <BrandLogo size="sm" />
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-[13px] text-muted-foreground">
              <a
                href="#capabilities"
                className="hover:text-foreground transition-colors"
              >
                Capabilities
              </a>
              <a
                href="#blueprints"
                className="hover:text-foreground transition-colors"
              >
                Examples
              </a>
              <a
                href="#faq"
                className="hover:text-foreground transition-colors"
              >
                FAQ
              </a>
              {savedProjects.length > 0 && (
                <Link
                  href="/studio"
                  className="text-foreground font-medium hover:underline underline-offset-4"
                >
                  Workspace ({savedProjects.length})
                </Link>
              )}
            </nav>
          </div>

          {/* Right: Mobile saved shortcut (if any) + Single GitHub button */}
          <div className="flex items-center gap-2 shrink-0">
            {savedProjects.length > 0 && (
              <Link
                href="/studio"
                className="inline-flex md:hidden h-8 items-center rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                Saved ({savedProjects.length})
              </Link>
            )}

            <a
              href="https://github.com/tanisheesh/Prompt2App"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <GitHubMark className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* =====================================================
            1. HERO + INTERACTIVE COMPOSER + INTERACTIVE DEMO WINDOW
            ===================================================== */}
        <section className="mx-auto max-w-5xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20 sm:pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.1]">
              What do you want to build?
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Describe any tool, dashboard, or interactive app in plain English.
              Preview it live, refine with follow-up prompts, and export a
              single runnable HTML file.
            </p>
          </div>

          {/* Prompt Composer */}
          <div className="mx-auto mt-8 max-w-2xl">
            <PromptComposer
              prompt={prompt}
              onPromptChange={setPrompt}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              isGenerating={false}
              onSubmit={() => handleLaunchStudio()}
            />

            {/* Quick Starter Pills */}
            <div className="mt-3.5">
              <StarterTemplates
                onSelectTemplate={(tpl) => handleStarterSelect(tpl, false)}
              />
            </div>
          </div>

          {/* Saved Apps Strip (only if user has built apps) */}
          {savedProjects.length > 0 && (
            <div className="mx-auto mt-10 max-w-2xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Continue in Studio
                </span>
                <Link
                  href="/studio"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Open Studio →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {savedProjects.slice(0, 2).map((proj) => (
                  <Link
                    key={proj.id}
                    href={`/studio?project=${proj.id}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 transition-colors hover:border-foreground/25 hover:bg-secondary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {proj.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        v{proj.versions.length} ·{' '}
                        {new Date(proj.updatedAt).toLocaleDateString(
                          undefined,
                          { month: 'short', day: 'numeric' }
                        )}
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Studio Showcase Frame */}
          <div className="mt-16 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="ml-2 font-code text-[11px] text-muted-foreground hidden sm:inline">
                  Revenue Telemetry · v2
                </span>
              </div>

              {/* Interactive Preview / Code toggle right on the landing page */}
              <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDemoTab('preview')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 font-medium transition-colors ${
                    demoTab === 'preview'
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="h-3 w-3" /> Preview
                </button>
                <button
                  type="button"
                  onClick={() => setDemoTab('code')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 font-medium transition-colors ${
                    demoTab === 'code'
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Code2 className="h-3 w-3" /> Code
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border">
              {/* Left Version Rail */}
              <div className="md:col-span-4 p-4 sm:p-5 bg-background/50 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="rounded-xl border border-border/70 bg-secondary/25 p-3">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span className="font-code font-medium text-foreground">
                        v1
                      </span>
                      <span className="font-code">2.3s</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Monthly revenue dashboard with MRR, active accounts, and
                      12-month growth bar chart.
                    </p>
                  </div>

                  <div className="rounded-xl border border-foreground/20 bg-card p-3 shadow-sm">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span className="font-code font-medium text-emerald-500">
                        v2 · Active
                      </span>
                      <span className="font-code">1.8s</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">
                      Add cohort filter pills and 1-click CSV export.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Ask for changes...</span>
                  <span className="font-code text-[10px] text-muted-foreground/70">
                    ↵
                  </span>
                </div>
              </div>

              {/* Right Live Preview / Source View */}
              <div className="md:col-span-8 bg-card min-h-[290px]">
                {demoTab === 'preview' ? (
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Net Revenue
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Updated live inside isolated browser sandbox
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                          Enterprise
                        </span>
                        <span className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                          Export CSV
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="rounded-xl border border-border bg-background p-3.5">
                        <p className="text-[11px] text-muted-foreground">MRR</p>
                        <p className="mt-1 text-base sm:text-xl font-semibold tabular-nums">
                          $48,290
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-background p-3.5">
                        <p className="text-[11px] text-muted-foreground">
                          Accounts
                        </p>
                        <p className="mt-1 text-base sm:text-xl font-semibold tabular-nums">
                          1,842
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-background p-3.5">
                        <p className="text-[11px] text-muted-foreground">
                          Retention
                        </p>
                        <p className="mt-1 text-base sm:text-xl font-semibold tabular-nums">
                          112.4%
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background p-4">
                      <div className="flex items-end justify-between gap-2 h-24 pt-2">
                        {[36, 42, 40, 54, 62, 58, 70, 76, 82, 80, 91, 100].map(
                          (val, i) => (
                            <div
                              key={i}
                              className="flex-1 rounded-t bg-foreground/80"
                              style={{ height: `${val}%` }}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full bg-[#0A0A0A] p-5 font-code text-xs leading-relaxed text-zinc-300 overflow-x-auto">
                    <pre>{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Revenue Telemetry</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 p-6">
  <!-- Self-contained HTML + CSS + JS, zero dependencies -->
  <main id="app"></main>
</body>
</html>`}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            2. ARCHITECTURAL CAPABILITIES (Vercel/Linear Bordered Spec Grid — NO Icon Boxes)
            ===================================================== */}
        <section
          id="capabilities"
          className="scroll-mt-16 border-t border-border"
        >
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Designed for fast, iterative prototyping.
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                  No project scaffolding, no package lockfiles, and no waiting
                  20 seconds on a blank spinner.
                </p>
              </div>
              <span className="font-code text-xs text-muted-foreground">
                Single-file HTML5 output
              </span>
            </div>

            {/* Asymmetric 2x2 Architectural Grid with real UI artifacts inside */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-border rounded-2xl overflow-hidden">
              {/* Cell 1: Sub-3s Streaming */}
              <div className="border-r border-b border-border bg-card/50 p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div>
                  <span className="font-code text-[11px] text-muted-foreground">
                    01 / INFERENCE
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-foreground">
                    500–1,000 tok/s LPU code streaming
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Switch between OpenAI GPT-OSS 120B, Qwen 3.8 27B, and
                    GPT-OSS 20B with automatic fallback if a model hits rate
                    limits.
                  </p>
                </div>

                {/* Mini Telemetry Artifact */}
                <div className="rounded-xl border border-border bg-background p-3 font-code text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">openai/gpt-oss-120b</span>
                    <span className="text-emerald-500 tabular-nums">~500 tok/s</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[82%] rounded-full bg-foreground" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>openai/gpt-oss-20b</span>
                    <span className="tabular-nums">~1,000 tok/s</span>
                  </div>
                </div>
              </div>

              {/* Cell 2: Iterative Versioning */}
              <div className="border-r border-b border-border bg-card/50 p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div>
                  <span className="font-code text-[11px] text-muted-foreground">
                    02 / ITERATION
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-foreground">
                    Conversational edits with version snapshots
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Refine layouts, add charts, or fix bugs in plain English.
                    Every change appends a clean snapshot so you can roll back
                    anytime.
                  </p>
                </div>

                {/* Mini Version Diff Artifact */}
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-3 font-code text-xs overflow-x-auto">
                  <span className="rounded border border-border px-2 py-1 text-muted-foreground">
                    v1 Initial
                  </span>
                  <span className="text-muted-foreground/50">→</span>
                  <span className="rounded border border-border px-2 py-1 text-muted-foreground">
                    v2 +Search
                  </span>
                  <span className="text-muted-foreground/50">→</span>
                  <span className="rounded bg-primary px-2 py-1 text-primary-foreground font-medium">
                    v3 +CSV Export
                  </span>
                </div>
              </div>

              {/* Cell 3: Sandboxed Responsive Workbench */}
              <div className="border-r border-b border-border bg-card/50 p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div>
                  <span className="font-code text-[11px] text-muted-foreground">
                    03 / RUNTIME
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-foreground">
                    Responsive viewport frames & self-healing sandbox
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Inspect Desktop, 768px Tablet, and 390px Mobile frames in an
                    isolated iframe with an injected storage shim and 1-click JS
                    error patching.
                  </p>
                </div>

                {/* Mini Viewport Bar Artifact */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs">
                  <div className="inline-flex items-center gap-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
                      <Monitor className="h-3.5 w-3.5" /> 100%
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Tablet className="h-3.5 w-3.5" /> 768px
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5" /> 390px
                    </span>
                  </div>
                  <span className="font-code text-[11px] text-emerald-500">
                    sandboxed
                  </span>
                </div>
              </div>

              {/* Cell 4: Voice + Zero-Dependency Export */}
              <div className="border-r border-b border-border bg-card/50 p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div>
                  <span className="font-code text-[11px] text-muted-foreground">
                    04 / PORTABILITY
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-foreground">
                    Voice dictation & zero-dependency export
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Dictate specs in any browser with Whisper V3 Turbo, then
                    download a single portable <code>.html</code> file that
                    works offline forever.
                  </p>
                </div>

                {/* Mini Export Artifact */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3.5 py-2.5 font-code text-xs">
                  <span className="text-foreground truncate">
                    expense-tracker-v2.html
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    14.2 KB · standalone
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            3. EXAMPLES INDEX (Clean Editorial Rows — NO bloated cards)
            ===================================================== */}
        <section id="blueprints" className="scroll-mt-16 border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Start from an example
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Click any prompt below to compile and customize it live in
                  Studio.
                </p>
              </div>
            </div>

            <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
              {STARTER_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleStarterSelect(tpl, true)}
                  className="group flex w-full flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-4 text-left transition-colors hover:bg-secondary/45"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-foreground">
                        {tpl.title}
                      </span>
                      <span className="font-code text-[11px] text-muted-foreground">
                        {tpl.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {tpl.prompt}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground shrink-0">
                    <span>Build</span>
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            4. CLEAN COLLAPSIBLE FAQ (2-Column Editorial Split)
            ===================================================== */}
        <section id="faq" className="scroll-mt-16 border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Questions &amp; Answers
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Everything about how Prompt2App generates, sandboxes, and
                  exports applications.
                </p>
              </div>

              <div className="lg:col-span-8 divide-y divide-border border-t border-b border-border">
                {FAQ_ITEMS.map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-foreground' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="pb-4 pr-8 text-sm leading-relaxed text-muted-foreground">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================
          FOOTER (Tanish & Nishant · Single GitHub link)
          ===================================================== */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-5xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" />
            <span className="text-border">·</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>

          <div>
            Built by{' '}
            <a
              href="https://github.com/tanisheesh"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline underline-offset-4"
            >
              Tanish
            </a>{' '}
            &amp;{' '}
            <a
              href="https://github.com/nishant-codess"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline underline-offset-4"
            >
              Nishant
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

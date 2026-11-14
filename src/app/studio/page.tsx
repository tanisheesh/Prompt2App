'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StudioHeader } from '@/components/studio/studio-header';
import { PromptComposer } from '@/components/studio/prompt-composer';
import { StarterTemplates } from '@/components/studio/starter-templates';
import { WorkspaceToolbar } from '@/components/studio/workspace-toolbar';
import { PreviewCanvas } from '@/components/studio/preview-canvas';
import { CodeViewer } from '@/components/studio/code-viewer';
import { ProjectSidebar } from '@/components/studio/project-sidebar';
import { ProjectsDialog } from '@/components/studio/projects-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DEFAULT_MODEL_ID,
  cleanHtmlOutput,
  isValidModelId,
} from '@/lib/groq';
import {
  appendVersionToProject,
  createNewProject,
  deriveProjectTitle,
  loadActiveProjectId,
  loadProjects,
  saveActiveProjectId,
  saveProjects,
} from '@/lib/storage';
import type {
  AppVersion,
  GroqModelId,
  ProjectItem,
  StarterTemplate,
  ViewportMode,
  WorkspaceTab,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ArrowUp, ArrowUpRight } from 'lucide-react';

function StudioWorkspaceInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [mobileEditInput, setMobileEditInput] = useState('');
  const [selectedModel, setSelectedModel] =
    useState<GroqModelId>(DEFAULT_MODEL_ID);

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingCode, setStreamingCode] = useState('');
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [liveTokensPerSec, setLiveTokensPerSec] = useState<number | undefined>(
    undefined
  );

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('preview');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [projectsDialogOpen, setProjectsDialogOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastHandledSearchRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Abort any in-flight stream on component unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Allow exiting fullscreen via Escape key
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const updateProjectsList = useCallback(
    (updater: (prev: ProjectItem[]) => ProjectItem[]) => {
      setProjects((prev) => {
        const next = updater(prev);
        saveProjects(next);
        return next;
      });
    },
    []
  );

  const runGeneration = useCallback(
    async (opts: {
      promptText: string;
      modelOverride?: GroqModelId;
      existingProject?: ProjectItem | null;
      baseCode?: string;
    }) => {
      const trimmedPrompt = opts.promptText.trim();
      if (!trimmedPrompt) {
        toast({
          variant: 'destructive',
          title: 'Prompt is empty',
          description: 'Please describe the app you want to build.',
        });
        return;
      }

      const modelToUse = opts.modelOverride ?? selectedModel;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsGenerating(true);
      setStreamingCode('');
      setPendingPrompt(trimmedPrompt);
      setLiveTokensPerSec(undefined);

      const startTime = performance.now();
      let rawAccumulated = '';

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trimmedPrompt,
            model: modelToUse,
            currentCode: opts.baseCode || undefined,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(
            errJson.error || `Generation failed (${res.status})`
          );
        }

        const usedModelHeader = res.headers.get('X-Model-Used');
        const effectiveModel: GroqModelId = isValidModelId(usedModelHeader)
          ? usedModelHeader
          : modelToUse;

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error('Response stream unavailable.');
        }

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          rawAccumulated += decoder.decode(value, { stream: true });

          const cleanedPartial = cleanHtmlOutput(rawAccumulated);
          setStreamingCode(cleanedPartial);

          const elapsedSec = (performance.now() - startTime) / 1000;
          if (elapsedSec > 0.25) {
            const approxTokens = Math.round(rawAccumulated.length / 3.8);
            setLiveTokensPerSec(Math.round(approxTokens / elapsedSec));
          }
        }
        // Flush any remaining multi-byte UTF-8 sequence in TextDecoder
        rawAccumulated += decoder.decode();

        const durationMs = Math.round(performance.now() - startTime);
        const finalHtml = cleanHtmlOutput(rawAccumulated);

        if (!finalHtml || finalHtml.length < 30) {
          throw new Error('AI returned an incomplete HTML file. Try again.');
        }

        const approxTotalTokens = Math.round(rawAccumulated.length / 3.8);
        const finalTps = Math.max(
          1,
          Math.round(approxTotalTokens / Math.max(0.1, durationMs / 1000))
        );

        if (opts.existingProject) {
          const updatedProject = appendVersionToProject(opts.existingProject, {
            prompt: trimmedPrompt,
            code: finalHtml,
            model: effectiveModel,
            durationMs,
            tokensPerSec: finalTps,
          });
          updateProjectsList((prev) => [
            updatedProject,
            ...prev.filter((p) => p.id !== updatedProject.id),
          ]);
          setActiveProjectId(updatedProject.id);
          saveActiveProjectId(updatedProject.id);
        } else {
          const newProj = createNewProject({
            prompt: trimmedPrompt,
            code: finalHtml,
            model: effectiveModel,
            durationMs,
            tokensPerSec: finalTps,
          });
          updateProjectsList((prev) => [newProj, ...prev]);
          setActiveProjectId(newProj.id);
          saveActiveProjectId(newProj.id);
        }

        setReloadKey((k) => k + 1);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        toast({
          variant: 'destructive',
          title: 'Generation failed',
          description:
            err instanceof Error
              ? err.message
              : 'Something went wrong while generating your app.',
        });
      } finally {
        if (abortControllerRef.current === controller) {
          setIsGenerating(false);
          setStreamingCode('');
          setPendingPrompt('');
        }
      }
    },
    [selectedModel, toast, updateProjectsList]
  );

  // Hydrate saved projects and handle query parameters from Landing Page
  useEffect(() => {
    const storedProjects = loadProjects();
    setProjects(storedProjects);

    const searchSignature = searchParams.toString();
    if (lastHandledSearchRef.current === searchSignature) return;
    lastHandledSearchRef.current = searchSignature;

    const queryPrompt = searchParams.get('prompt');
    const queryModel = searchParams.get('model');
    const queryProjectId = searchParams.get('project');
    const queryNew = searchParams.get('new');

    if (isValidModelId(queryModel)) {
      setSelectedModel(queryModel);
    }

    if (queryPrompt && queryPrompt.trim()) {
      const validModel = isValidModelId(queryModel)
        ? queryModel
        : DEFAULT_MODEL_ID;
      setPrompt(queryPrompt);
      setActiveProjectId(null);
      saveActiveProjectId(null);
      lastHandledSearchRef.current = '';
      router.replace('/studio', { scroll: false });
      runGeneration({ promptText: queryPrompt, modelOverride: validModel });
      return;
    }

    if (queryProjectId) {
      const target = storedProjects.find((p) => p.id === queryProjectId);
      if (target) {
        setActiveProjectId(target.id);
        saveActiveProjectId(target.id);
        lastHandledSearchRef.current = '';
        router.replace('/studio', { scroll: false });
        return;
      }
    }

    if (queryNew === '1') {
      setActiveProjectId(null);
      saveActiveProjectId(null);
      lastHandledSearchRef.current = '';
      router.replace('/studio', { scroll: false });
      return;
    }

    const storedActiveId = loadActiveProjectId();
    if (
      storedActiveId &&
      storedProjects.some((p) => p.id === storedActiveId)
    ) {
      setActiveProjectId(storedActiveId);
    }
  }, [router, runGeneration, searchParams]);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ?? null;

  const activeVersion: AppVersion | null = activeProject
    ? activeProject.versions.find(
        (v) => v.id === activeProject.currentVersionId
      ) ??
      activeProject.versions[activeProject.versions.length - 1] ??
      null
    : null;

  const displayedCode = isGenerating
    ? streamingCode || activeVersion?.code || ''
    : activeVersion?.code || '';

  const handleSelectProject = (proj: ProjectItem) => {
    setActiveProjectId(proj.id);
    saveActiveProjectId(proj.id);
  };

  const handleNewProject = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setStreamingCode('');
    setActiveProjectId(null);
    saveActiveProjectId(null);
    setPrompt('');
    setIsFullscreen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    updateProjectsList((prev) => prev.filter((p) => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      saveActiveProjectId(null);
    }
  };

  const handleClearAllProjects = () => {
    updateProjectsList(() => []);
    setActiveProjectId(null);
    saveActiveProjectId(null);
    setProjectsDialogOpen(false);
  };

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
  };

  const handleInitialGenerate = () => {
    runGeneration({ promptText: prompt });
  };

  const handleSelectTemplate = (
    template: StarterTemplate,
    autoRun: boolean
  ) => {
    setPrompt(template.prompt);
    if (autoRun) {
      runGeneration({ promptText: template.prompt });
    }
  };

  const handleSubmitRefinement = (refinementPrompt: string) => {
    if (!activeProject || !activeVersion) return;
    setMobileDrawerOpen(false);
    runGeneration({
      promptText: refinementPrompt,
      existingProject: activeProject,
      baseCode: activeVersion.code,
    });
  };

  const handleMobileQuickSubmit = () => {
    const trimmed = mobileEditInput.trim();
    if (!trimmed || isGenerating) return;
    handleSubmitRefinement(trimmed);
    setMobileEditInput('');
  };

  const handleAutoFixRuntimeError = (errorMessage: string) => {
    if (!activeProject || !activeVersion) return;
    const fixInstruction = `Fix this JavaScript error in the app while keeping all existing features working: "${errorMessage}"`;
    runGeneration({
      promptText: fixInstruction,
      existingProject: activeProject,
      baseCode: activeVersion.code,
    });
  };

  const handleSelectVersion = (versionId: string) => {
    if (!activeProject) return;
    const updated: ProjectItem = {
      ...activeProject,
      currentVersionId: versionId,
    };
    updateProjectsList((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setReloadKey((k) => k + 1);
    setMobileDrawerOpen(false);
  };

  const handleCopyCode = () => {
    if (!displayedCode) return;
    navigator.clipboard.writeText(displayedCode).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Clipboard unavailable',
        description: 'Could not copy code automatically.',
      });
    });
  };

  const handleDownloadHtml = () => {
    if (!displayedCode) return;
    const slug = (activeProject?.title || 'prompt2app')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const verSuffix = activeVersion ? `-v${activeVersion.versionNumber}` : '';
    const filename = `${slug || 'app'}${verSuffix}.html`;

    const blob = new Blob([displayedCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleOpenNewTab = () => {
    if (!displayedCode) return;
    const blob = new Blob([displayedCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const showWorkbench = Boolean(activeProject || isGenerating);

  const workspaceProject: ProjectItem = activeProject ?? {
    id: 'streaming-temp',
    title: deriveProjectTitle(pendingPrompt || prompt),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [
      {
        id: 'streaming-ver-1',
        versionNumber: 1,
        prompt: pendingPrompt || prompt,
        code: streamingCode,
        model: selectedModel,
        createdAt: Date.now(),
      },
    ],
    currentVersionId: 'streaming-ver-1',
  };

  const workspaceVersion: AppVersion =
    activeVersion ?? workspaceProject.versions[0];

  /* =========================================================
     EMPTY STUDIO COMPOSER (when starting a new app inside /studio)
     ========================================================= */
  if (!showWorkbench) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
        <StudioHeader
          savedProjectsCount={projects.length}
          onNewProject={handleNewProject}
          onOpenProjectsModal={() => setProjectsDialogOpen(true)}
          isStudioRoute
        />

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-2xl">
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                What do you want to build?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Describe your app idea in plain English. Preview it live and
                download the HTML.
              </p>
            </div>

            <PromptComposer
              prompt={prompt}
              onPromptChange={setPrompt}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              isGenerating={isGenerating}
              onSubmit={handleInitialGenerate}
              onStop={handleStopGeneration}
            />

            <div className="mt-4">
              <StarterTemplates
                onSelectTemplate={handleSelectTemplate}
                disabled={isGenerating}
              />
            </div>

            {projects.length > 0 && (
              <div className="mt-12">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-medium text-muted-foreground">
                    Saved in Studio
                  </h2>
                  {projects.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setProjectsDialogOpen(true)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View all ({projects.length})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {projects.slice(0, 4).map((proj) => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => handleSelectProject(proj)}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-left transition-colors hover:border-foreground/25 hover:bg-secondary/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {proj.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          v{proj.versions.length} ·{' '}
                          {new Date(proj.updatedAt).toLocaleDateString(
                            undefined,
                            { month: 'short', day: 'numeric' }
                          )}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        <ProjectsDialog
          open={projectsDialogOpen}
          onOpenChange={setProjectsDialogOpen}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onDeleteProject={handleDeleteProject}
          onClearAll={handleClearAllProjects}
        />
      </div>
    );
  }

  /* =========================================================
     ACTIVE STUDIO WORKBENCH (Responsive Desktop + Tablet + Mobile)
     ========================================================= */
  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      <WorkspaceToolbar
        projectTitle={workspaceProject.title}
        versionNumber={workspaceVersion.versionNumber}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        viewport={viewport}
        onViewportChange={setViewport}
        isGenerating={isGenerating}
        code={displayedCode}
        tokensPerSec={
          isGenerating ? liveTokensPerSec : workspaceVersion.tokensPerSec
        }
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
        savedProjectsCount={projects.length}
        onNewProject={handleNewProject}
        onOpenProjectsModal={() => setProjectsDialogOpen(true)}
        onReloadPreview={() => setReloadKey((k) => k + 1)}
        onOpenNewTab={handleOpenNewTab}
        onDownloadHtml={handleDownloadHtml}
        onCopyCode={handleCopyCode}
      />

      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Desktop Chat & Version Sidebar */}
        {sidebarOpen && !isFullscreen && (
          <div className="hidden lg:block h-full w-[320px] shrink-0">
            <ProjectSidebar
              project={workspaceProject}
              activeVersion={workspaceVersion}
              isGenerating={isGenerating}
              onSelectVersion={handleSelectVersion}
              onSubmitRefinement={handleSubmitRefinement}
              onStopGeneration={handleStopGeneration}
            />
          </div>
        )}

        {/* Main Preview / Code / Split Stage */}
        <div className="flex flex-1 min-w-0 min-h-0 flex-col overflow-hidden">
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            {activeTab === 'preview' && (
              <PreviewCanvas
                code={displayedCode}
                isGenerating={isGenerating}
                viewport={viewport}
                reloadKey={reloadKey}
                onAutoFixError={handleAutoFixRuntimeError}
              />
            )}

            {activeTab === 'code' && (
              <CodeViewer
                code={displayedCode}
                isGenerating={isGenerating}
                onCopy={handleCopyCode}
              />
            )}

            {activeTab === 'split' && (
              <div className="grid h-full w-full min-h-0 grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                <div className="h-full min-h-0 overflow-hidden">
                  <PreviewCanvas
                    code={displayedCode}
                    isGenerating={isGenerating}
                    viewport={viewport}
                    reloadKey={reloadKey}
                    onAutoFixError={handleAutoFixRuntimeError}
                  />
                </div>
                <div className="h-full min-h-0 overflow-hidden">
                  <CodeViewer
                    code={displayedCode}
                    isGenerating={isGenerating}
                    onCopy={handleCopyCode}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mobile / Tablet Bottom Quick-Edit Bar (<1024px) */}
          {!isFullscreen && (
            <div className="flex lg:hidden shrink-0 items-center gap-2 border-t border-border bg-card p-2.5">
              <input
                type="text"
                value={mobileEditInput}
                onChange={(e) => setMobileEditInput(e.target.value)}
                placeholder={`Ask for changes on v${workspaceVersion.versionNumber}...`}
                disabled={isGenerating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleMobileQuickSubmit();
                  }
                }}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40"
              />
              <button
                type="button"
                onClick={handleMobileQuickSubmit}
                disabled={isGenerating || !mobileEditInput.trim()}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-30 transition-opacity"
                aria-label="Send changes"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile / Tablet Version & Chat Sheet Drawer */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent
          side="left"
          className="w-[88vw] max-w-[340px] p-0 flex flex-col"
        >
          <SheetHeader className="border-b border-border px-4 py-3 text-left">
            <SheetTitle className="text-sm font-semibold">
              Versions &amp; Edits
            </SheetTitle>
            <SheetDescription className="sr-only">
              Switch between app versions or submit follow-up changes.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ProjectSidebar
              project={workspaceProject}
              activeVersion={workspaceVersion}
              isGenerating={isGenerating}
              onSelectVersion={handleSelectVersion}
              onSubmitRefinement={handleSubmitRefinement}
              onStopGeneration={handleStopGeneration}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ProjectsDialog
        open={projectsDialogOpen}
        onOpenChange={setProjectsDialogOpen}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onDeleteProject={handleDeleteProject}
        onClearAll={handleClearAllProjects}
      />
    </div>
  );
}

export default function StudioRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] w-full items-center justify-center bg-background text-sm text-muted-foreground">
          Loading Studio...
        </div>
      }
    >
      <StudioWorkspaceInner />
    </Suspense>
  );
}

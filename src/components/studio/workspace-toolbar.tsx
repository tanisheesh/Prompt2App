'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  FolderOpen,
  Loader2,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BrandLogo } from '@/components/brand-logo';
import { GROQ_MODELS, getModelConfig } from '@/lib/groq';
import type { GroqModelId, ViewportMode, WorkspaceTab } from '@/lib/types';

interface WorkspaceToolbarProps {
  projectTitle: string;
  versionNumber: number;
  selectedModel: GroqModelId;
  onModelChange: (model: GroqModelId) => void;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  viewport: ViewportMode;
  onViewportChange: (viewport: ViewportMode) => void;
  isGenerating: boolean;
  code: string;
  tokensPerSec?: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobileDrawer: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  savedProjectsCount: number;
  onNewProject: () => void;
  onOpenProjectsModal: () => void;
  onReloadPreview: () => void;
  onOpenNewTab: () => void;
  onDownloadHtml: () => void;
  onCopyCode: () => void;
}

export function WorkspaceToolbar({
  projectTitle,
  versionNumber,
  selectedModel,
  onModelChange,
  activeTab,
  onTabChange,
  viewport,
  onViewportChange,
  isGenerating,
  code,
  tokensPerSec,
  sidebarOpen,
  onToggleSidebar,
  onOpenMobileDrawer,
  isFullscreen,
  onToggleFullscreen,
  savedProjectsCount,
  onNewProject,
  onOpenProjectsModal,
  onReloadPreview,
  onOpenNewTab,
  onDownloadHtml,
  onCopyCode,
}: WorkspaceToolbarProps) {
  const [copied, setCopied] = useState(false);
  const activeModel = getModelConfig(selectedModel);

  const handleCopy = () => {
    onCopyCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <header className="flex flex-col shrink-0 border-b border-border bg-background">
      {/* Primary Row */}
      <div className="flex h-12 w-full items-center justify-between gap-2 px-2.5 sm:px-3">
        {/* LEFT: Sidebar / Mobile Chat Toggle + Brand + App Name + Model + New */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {!isFullscreen && (
            <>
              <button
                type="button"
                onClick={onToggleSidebar}
                className="hidden lg:inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                title={sidebarOpen ? 'Hide chat panel' : 'Show chat panel'}
                aria-label={sidebarOpen ? 'Hide chat panel' : 'Show chat panel'}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                onClick={onOpenMobileDrawer}
                className="inline-flex lg:hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-secondary transition-colors"
                title="Versions & Edits"
                aria-label="Open versions and chat panel"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          <Link
            href="/"
            className="shrink-0 focus:outline-none"
            title="Back to Landing Page"
          >
            <BrandLogo size="sm" showText={false} />
          </Link>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate text-xs sm:text-sm font-medium text-foreground max-w-[100px] sm:max-w-[180px]">
              {projectTitle}
            </span>
            <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 font-code text-[10px] sm:text-[11px] font-medium text-muted-foreground">
              v{versionNumber}
            </span>
          </div>

          {/* Model Switcher inside Workbench */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isGenerating}>
              <button
                type="button"
                disabled={isGenerating}
                className="hidden xl:inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
                title="Switch AI model for follow-up edits"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{activeModel.name}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={6}
              className="w-[250px] rounded-xl p-1.5"
            >
              {GROQ_MODELS.map((m) => {
                const isSelected = m.id === selectedModel;
                return (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => onModelChange(m.id)}
                    className="flex cursor-pointer items-start justify-between gap-3 rounded-lg px-2.5 py-2"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {m.name}
                        </span>
                        <span className="rounded bg-secondary px-1.5 py-0.5 font-code text-[10px] text-muted-foreground">
                          {m.speed}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {m.badge}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={onNewProject}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Start a new app"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden md:inline">New</span>
          </button>

          {savedProjectsCount > 0 && (
            <button
              type="button"
              onClick={onOpenProjectsModal}
              className="hidden 2xl:inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span>My Apps ({savedProjectsCount})</span>
            </button>
          )}
        </div>

        {/* CENTER: Preview/Code/Split + Viewport Switcher (md+) */}
        <div className="hidden md:flex items-center gap-2">
          <div className="inline-flex h-8 items-center rounded-lg border border-border bg-secondary/50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onTabChange('preview')}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => onTabChange('code')}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                activeTab === 'code'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Code
            </button>
            <button
              type="button"
              onClick={() => onTabChange('split')}
              className={`hidden lg:inline-block rounded-md px-3 py-1 font-medium transition-colors ${
                activeTab === 'split'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Split
            </button>
          </div>

          {activeTab !== 'code' && (
            <div className="inline-flex h-8 items-center rounded-lg border border-border bg-secondary/50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => onViewportChange('desktop')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                  viewport === 'desktop'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Desktop full width"
              >
                <Monitor className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => onViewportChange('tablet')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                  viewport === 'tablet'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Tablet (768px)"
              >
                <Tablet className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Tablet</span>
              </button>
              <button
                type="button"
                onClick={() => onViewportChange('mobile')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                  viewport === 'mobile'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Mobile (390px)"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Mobile</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-1">
          {isGenerating && (
            <span className="hidden 2xl:inline-flex items-center gap-1.5 mr-2 text-xs text-muted-foreground tabular-nums">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
              <span>
                {tokensPerSec ? `${tokensPerSec} tok/s` : 'Generating...'}
              </span>
            </span>
          )}

          {savedProjectsCount > 0 && (
            <button
              type="button"
              onClick={onOpenProjectsModal}
              className="hidden md:inline-flex 2xl:hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title={`My Saved Apps (${savedProjectsCount})`}
              aria-label="Open saved apps"
            >
              <FolderOpen className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onReloadPreview}
            disabled={!code || isGenerating}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-35 transition-colors"
            title="Refresh preview"
            aria-label="Refresh preview"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenNewTab}
            disabled={!code || isGenerating}
            className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-35 transition-colors"
            title="Open in new tab"
            aria-label="Open preview in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!code}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2 sm:px-2.5 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-35 transition-colors"
            title="Copy HTML code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="hidden lg:inline">
              {copied ? 'Copied' : 'Copy'}
            </span>
          </button>

          <button
            type="button"
            onClick={onDownloadHtml}
            disabled={!code || isGenerating}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 sm:px-3 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-35 transition-opacity"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download HTML</span>
            <span className="sm:hidden">Save</span>
          </button>
        </div>
      </div>

      {/* Secondary Mobile Control Bar (<768px) */}
      <div className="flex md:hidden items-center justify-between gap-1.5 border-t border-border/60 bg-secondary/20 px-2.5 py-1.5">
        {/* Mobile Preview / Code toggle */}
        <div className="inline-flex h-7 items-center rounded-lg border border-border bg-secondary/60 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => onTabChange('preview')}
            className={`rounded-md px-2.5 py-0.5 font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => onTabChange('code')}
            className={`rounded-md px-2.5 py-0.5 font-medium transition-colors ${
              activeTab === 'code'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Code
          </button>
        </div>

        {/* Mobile Device Frame Icons */}
        {activeTab === 'preview' && (
          <div className="inline-flex h-7 items-center rounded-lg border border-border bg-secondary/60 p-0.5">
            <button
              type="button"
              onClick={() => onViewportChange('desktop')}
              className={`inline-flex h-6 w-6 items-center justify-center rounded ${
                viewport === 'desktop'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
              aria-label="Desktop view"
            >
              <Monitor className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onViewportChange('tablet')}
              className={`inline-flex h-6 w-6 items-center justify-center rounded ${
                viewport === 'tablet'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
              aria-label="Tablet view"
            >
              <Tablet className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onViewportChange('mobile')}
              className={`inline-flex h-6 w-6 items-center justify-center rounded ${
                viewport === 'mobile'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
              aria-label="Mobile view"
            >
              <Smartphone className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1">
          {savedProjectsCount > 0 && (
            <button
              type="button"
              onClick={onOpenProjectsModal}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-medium text-muted-foreground"
            >
              <FolderOpen className="h-3 w-3" />
              <span>{savedProjectsCount}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNewTab}
            disabled={!code || isGenerating}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-medium text-muted-foreground disabled:opacity-35"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Open</span>
          </button>
        </div>
      </div>
    </header>
  );
}

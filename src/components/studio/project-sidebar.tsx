'use client';

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, Square, Loader2, Check } from 'lucide-react';
import type { AppVersion, ProjectItem } from '@/lib/types';
import { VoiceRecorderButton } from './voice-recorder-button';

interface ProjectSidebarProps {
  project: ProjectItem;
  activeVersion: AppVersion;
  isGenerating: boolean;
  onSelectVersion: (versionId: string) => void;
  onSubmitRefinement: (refinementPrompt: string) => void;
  onStopGeneration: () => void;
}

const SUGGESTIONS = [
  'Add dark mode toggle',
  'Add CSV export',
  'Improve mobile layout',
];

export function ProjectSidebar({
  project,
  activeVersion,
  isGenerating,
  onSelectVersion,
  onSubmitRefinement,
  onStopGeneration,
}: ProjectSidebarProps) {
  const [followUp, setFollowUp] = useState('');

  const handleSend = () => {
    const trimmed = followUp.trim();
    if (!trimmed || isGenerating) return;
    onSubmitRefinement(trimmed);
    setFollowUp('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card/40">
      {/* Version History List */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-2">
          {project.versions.map((ver) => {
            const isSelected = ver.id === activeVersion.id;
            return (
              <button
                key={ver.id}
                type="button"
                onClick={() => onSelectVersion(ver.id)}
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-foreground/25 bg-card shadow-sm'
                    : 'border-transparent bg-secondary/35 hover:bg-secondary/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <span className="rounded bg-secondary px-1.5 py-0.5 font-code text-[10px]">
                      v{ver.versionNumber}
                    </span>
                    <span className="text-muted-foreground font-normal">
                      {ver.versionNumber === 1 ? 'Initial app' : 'Updated'}
                    </span>
                  </span>

                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                  )}
                </div>

                <p className="text-xs text-foreground/85 line-clamp-3 leading-relaxed">
                  {ver.prompt}
                </p>
              </button>
            );
          })}

          {isGenerating && (
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating v{project.versions.length + 1}...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Chat / Edit Input */}
      <div className="border-t border-border bg-background p-3 space-y-2">
        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              disabled={isGenerating}
              onClick={() => onSubmitRefinement(item)}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:border-foreground/25 hover:text-foreground transition-colors disabled:opacity-40"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <div className="rounded-xl border border-border bg-card p-2.5 focus-within:border-foreground/30 transition-colors">
          <textarea
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            rows={2}
            placeholder="Ask for changes... (e.g. Add search bar)"
            className="w-full resize-none bg-transparent text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <VoiceRecorderButton
              onTranscript={(t) =>
                setFollowUp((prev) => (prev.trim() ? `${prev.trim()} ${t}` : t))
              }
              disabled={isGenerating}
            />

            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-destructive px-2.5 text-xs font-medium text-destructive-foreground"
              >
                <Square className="h-2.5 w-2.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!followUp.trim()}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-opacity"
                title="Send changes"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUp,
  Square,
  Loader2,
  Wand2,
  ChevronDown,
  Check,
} from 'lucide-react';
import { GROQ_MODELS, getModelConfig } from '@/lib/groq';
import type { GroqModelId } from '@/lib/types';
import { VoiceRecorderButton } from './voice-recorder-button';
import { useToast } from '@/hooks/use-toast';

interface PromptComposerProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  selectedModel: GroqModelId;
  onModelChange: (model: GroqModelId) => void;
  isGenerating: boolean;
  onSubmit: () => void;
  onStop?: () => void;
  placeholder?: string;
}

export function PromptComposer({
  prompt,
  onPromptChange,
  selectedModel,
  onModelChange,
  isGenerating,
  onSubmit,
  onStop,
  placeholder = 'Describe an app to build — e.g. "A personal expense tracker with category budgets and charts"',
}: PromptComposerProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  const activeModel = getModelConfig(selectedModel);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && prompt.trim()) {
        onSubmit();
      }
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || prompt.trim().length < 3) {
      toast({
        variant: 'destructive',
        title: 'Type a short idea first',
        description: 'Write a few words first so AI can expand your prompt.',
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to improve prompt.');
      }
      if (data.enhancedPrompt) {
        onPromptChange(data.enhancedPrompt);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could not improve prompt',
        description: err instanceof Error ? err.message : 'Request failed.',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    onPromptChange(prompt.trim() ? `${prompt.trim()} ${transcript}` : transcript);
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-card shadow-sm transition-all focus-within:border-foreground/30 focus-within:shadow-md">
      <div className="px-4 pt-3.5 pb-2">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          disabled={isGenerating}
          className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-60"
          aria-label="App description"
        />
      </div>

      {/* Bottom Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          {/* Clean Single-Line Model Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isGenerating}>
              <button
                type="button"
                disabled={isGenerating}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary focus:outline-none disabled:opacity-50"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{activeModel.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              sideOffset={6}
              className="w-[260px] rounded-xl p-1.5"
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
                        <span className="rounded bg-secondary px-1.5 py-0.2 font-code text-[10px] text-muted-foreground">
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

          {/* Clean Enhance Pill Button */}
          <button
            type="button"
            onClick={handleEnhancePrompt}
            disabled={isGenerating || isEnhancing}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            title="Rewrite short idea into a detailed prompt"
          >
            {isEnhancing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            <span>{isEnhancing ? 'Enhancing...' : 'Enhance'}</span>
          </button>
        </div>

        {/* Right: Mic + Generate */}
        <div className="flex items-center gap-1.5 ml-auto">
          <VoiceRecorderButton
            onTranscript={handleVoiceTranscript}
            disabled={isGenerating}
          />

          {isGenerating && onStop ? (
            <button
              type="button"
              onClick={onStop}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-destructive px-3.5 text-xs font-medium text-destructive-foreground transition-opacity hover:opacity-90"
            >
              <Square className="h-2.5 w-2.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isGenerating || !prompt.trim()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              <span>Generate</span>
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

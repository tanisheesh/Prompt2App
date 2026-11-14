'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import { injectSandboxRuntime } from '@/lib/sandbox';
import type { RuntimeErrorItem, ViewportMode } from '@/lib/types';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface PreviewCanvasProps {
  code: string;
  isGenerating: boolean;
  viewport: ViewportMode;
  reloadKey: number;
  onAutoFixError?: (errorMessage: string) => void;
}

export function PreviewCanvas({
  code,
  isGenerating,
  viewport,
  reloadKey,
  onAutoFixError,
}: PreviewCanvasProps) {
  const instanceId = useId();
  const [runtimeErrors, setRuntimeErrors] = useState<RuntimeErrorItem[]>([]);

  useEffect(() => {
    setRuntimeErrors([]);
  }, [code, reloadKey]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data &&
        event.data.type === 'PROMPT2APP_RUNTIME_ERROR' &&
        event.data.instanceId === instanceId &&
        event.data.payload
      ) {
        const errPayload = event.data.payload as RuntimeErrorItem;
        setRuntimeErrors((prev) => {
          if (prev.some((e) => e.message === errPayload.message)) {
            return prev;
          }
          return [...prev.slice(-2), errPayload];
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [instanceId]);

  const hasClosingHtml =
    /<\/html>/i.test(code) || (!isGenerating && Boolean(code));

  const sandboxedHtml = useMemo(() => {
    if (!code) return '';
    if (isGenerating && !hasClosingHtml) {
      return '';
    }
    return injectSandboxRuntime(code, instanceId);
  }, [code, isGenerating, hasClosingHtml, instanceId]);

  const lineCount = useMemo(
    () => (code ? code.split('\n').length : 0),
    [code]
  );
  const latestError = runtimeErrors[runtimeErrors.length - 1];

  return (
    <div
      className={`relative flex h-full w-full min-h-0 items-center justify-center overflow-hidden ${
        viewport === 'desktop'
          ? 'bg-background p-0'
          : 'bg-preview-stage p-3 sm:p-6'
      }`}
    >
      {/* Clean Loading State while streaming HTML */}
      {isGenerating && !sandboxedHtml && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-8 py-7 text-center shadow-lg">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Building your app...
            </p>
            <p className="mt-1 font-code text-xs text-muted-foreground tabular-nums">
              {lineCount > 0
                ? `${lineCount} lines written`
                : 'Starting stream...'}
            </p>
          </div>
        </div>
      )}

      {/* Sandboxed Live App Preview */}
      {sandboxedHtml && (
        <>
          {viewport === 'desktop' && (
            <div className="h-full w-full overflow-hidden bg-[#0c0c0e]">
              <iframe
                key={`desktop-${reloadKey}`}
                srcDoc={sandboxedHtml}
                title="App Preview (Desktop)"
                className="block h-full w-full border-0 bg-[#0c0c0e]"
                sandbox="allow-scripts allow-forms allow-popups allow-modals allow-downloads"
              />
            </div>
          )}

          {viewport === 'tablet' && (
            <div className="flex h-full max-h-[960px] w-full max-w-[768px] flex-col overflow-hidden rounded-2xl border-2 border-border bg-card shadow-2xl transition-all duration-200">
              <div className="flex h-7 shrink-0 items-center justify-between border-b border-border bg-secondary/60 px-3 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-border" />
                  <span className="h-2 w-2 rounded-full bg-border" />
                  <span className="h-2 w-2 rounded-full bg-border" />
                </div>
                <span className="font-code">Tablet · 768px</span>
                <span className="w-8" />
              </div>
              <div className="relative flex-1 min-h-0 w-full bg-[#0c0c0e]">
                <iframe
                  key={`tablet-${reloadKey}`}
                  srcDoc={sandboxedHtml}
                  title="App Preview (Tablet 768px)"
                  className="block h-full w-full border-0 bg-[#0c0c0e]"
                  sandbox="allow-scripts allow-forms allow-popups allow-modals allow-downloads"
                />
              </div>
            </div>
          )}

          {viewport === 'mobile' && (
            <div className="flex h-full max-h-[820px] w-[390px] max-w-full flex-col overflow-hidden rounded-[28px] sm:rounded-[32px] border-[5px] sm:border-[6px] border-zinc-800 bg-zinc-900 shadow-2xl transition-all duration-200">
              <div className="flex h-6 sm:h-7 shrink-0 items-center justify-center bg-zinc-900 text-[10px] font-code text-zinc-400">
                <div className="h-1.5 w-16 rounded-full bg-zinc-700" />
              </div>
              <div className="relative flex-1 min-h-0 w-full overflow-hidden rounded-b-[20px] sm:rounded-b-[24px] bg-[#0c0c0e]">
                <iframe
                  key={`mobile-${reloadKey}`}
                  srcDoc={sandboxedHtml}
                  title="App Preview (Mobile 390px)"
                  className="block h-full w-full border-0 bg-[#0c0c0e]"
                  sandbox="allow-scripts allow-forms allow-popups allow-modals allow-downloads"
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Runtime Error Banner */}
      {latestError && !isGenerating && (
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-30 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground shadow-xl">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="truncate font-code text-xs text-muted-foreground">
              {latestError.message}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onAutoFixError && (
              <button
                type="button"
                onClick={() => onAutoFixError(latestError.message)}
                className="inline-flex h-7 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Fix error
              </button>
            )}
            <button
              type="button"
              onClick={() => setRuntimeErrors([])}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Check, Search, X } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  isGenerating: boolean;
  onCopy: () => void;
}

export function CodeViewer({ code, isGenerating, onCopy }: CodeViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isGenerating && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [code, isGenerating]);

  const lines = useMemo(() => (code || '').split('\n'), [code]);
  const sizeKb = ((code?.length || 0) / 1024).toFixed(1);

  const filteredLines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return lines.map((text, idx) => ({ lineNumber: idx + 1, text }));
    }
    const matches: { lineNumber: number; text: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(q)) {
        matches.push({ lineNumber: i + 1, text: lines[i] });
      }
    }
    return matches;
  }, [lines, searchQuery]);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#09090B] text-zinc-200">
      {/* File Header + Responsive Search */}
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-800/80 bg-[#111114] px-3 font-code text-[11px]">
        <div className="flex items-center gap-2 text-zinc-400 tabular-nums min-w-0">
          <span className="text-zinc-200 truncate">index.html</span>
          <span className="hidden xs:inline">·</span>
          <span className="hidden xs:inline">{lines.length}L</span>
          <span>·</span>
          <span>{sizeKb} KB</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative w-32 sm:w-44">
            <Search className="absolute left-2 top-1.5 h-3 w-3 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter..."
              aria-label="Filter source code lines"
              className="h-6 w-full rounded border border-zinc-800 bg-[#09090B] pl-6 pr-6 font-code text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1.5 text-zinc-500 hover:text-zinc-300"
                aria-label="Clear filter"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 px-2 font-code text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">
              {copied ? 'Copied' : 'Copy'}
            </span>
          </button>
        </div>
      </div>

      {/* Line-Numbered Source Table */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-auto p-3 font-code text-xs leading-[1.6]"
      >
        {filteredLines.length === 0 ? (
          <p className="py-8 text-center font-code text-xs text-zinc-500">
            No matching lines for &ldquo;{searchQuery}&rdquo;
          </p>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {filteredLines.map(({ lineNumber, text }) => (
                <tr
                  key={lineNumber}
                  className="hover:bg-zinc-900/60 transition-colors"
                >
                  <td className="select-none pr-4 text-right font-code text-[11px] text-zinc-600 w-10 align-top tabular-nums">
                    {lineNumber}
                  </td>
                  <td className="whitespace-pre-wrap break-all font-code text-zinc-300">
                    {text || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md';
  showText?: boolean;
}

export function GitHubMark({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}

export function BrandLogo({ size = 'md', showText = true }: BrandLogoProps) {
  const boxSize = size === 'sm' ? 'h-7 w-7 rounded-lg' : 'h-8 w-8 rounded-xl';
  const svgSize = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]';

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        className={`inline-flex ${boxSize} shrink-0 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-50 shadow-sm`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={svgSize}
          aria-hidden="true"
        >
          <path
            d="M6.5 8L10.5 12L6.5 16"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.5 16H17.5"
            stroke="#10B981"
            strokeWidth="2.25"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showText && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Prompt2App
        </span>
      )}
    </span>
  );
}

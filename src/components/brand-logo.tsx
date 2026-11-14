import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md';
  showText?: boolean;
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

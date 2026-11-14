'use client';

import React from 'react';
import Link from 'next/link';
import { Github } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

interface StudioHeaderProps {
  savedProjectsCount: number;
  onNewProject: () => void;
  onOpenProjectsModal: () => void;
  isStudioRoute?: boolean;
}

export function StudioHeader({
  savedProjectsCount,
  onOpenProjectsModal,
}: StudioHeaderProps) {
  return (
    <header className="w-full shrink-0 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="focus:outline-none">
          <BrandLogo size="sm" />
        </Link>

        <div className="flex items-center gap-2">
          {savedProjectsCount > 0 && (
            <button
              type="button"
              onClick={onOpenProjectsModal}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <span>Saved ({savedProjectsCount})</span>
            </button>
          )}

          <a
            href="https://github.com/tanisheesh/Prompt2App"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}

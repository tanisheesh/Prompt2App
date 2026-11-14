'use client';

import React from 'react';
import { STARTER_TEMPLATES } from '@/lib/prompts';
import type { StarterTemplate } from '@/lib/types';

interface StarterTemplatesProps {
  onSelectTemplate: (template: StarterTemplate, autoRun: boolean) => void;
  disabled?: boolean;
}

export function StarterTemplates({
  onSelectTemplate,
  disabled = false,
}: StarterTemplatesProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {STARTER_TEMPLATES.map((tpl) => (
        <button
          key={tpl.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelectTemplate(tpl, false)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/25 hover:bg-secondary hover:text-foreground disabled:opacity-40"
        >
          <span>{tpl.title}</span>
        </button>
      ))}
    </div>
  );
}

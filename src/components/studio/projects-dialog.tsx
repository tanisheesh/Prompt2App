'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import type { ProjectItem } from '@/lib/types';

interface ProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectItem[];
  activeProjectId: string | null;
  onSelectProject: (project: ProjectItem) => void;
  onDeleteProject: (projectId: string) => void;
  onClearAll: () => void;
}

export function ProjectsDialog({
  open,
  onOpenChange,
  projects,
  activeProjectId,
  onSelectProject,
  onDeleteProject,
  onClearAll,
}: ProjectsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border bg-card p-0 overflow-hidden">
        <DialogHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base font-semibold">
              My Saved Apps
            </DialogTitle>
            {projects.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Saved in your browser. Click any app to open it.
          </DialogDescription>
        </DialogHeader>

        {projects.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No saved apps yet.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y divide-border">
              {projects.map((proj) => {
                const isCurrent = proj.id === activeProjectId;
                const latestVersion =
                  proj.versions[proj.versions.length - 1] ?? proj.versions[0];

                return (
                  <div
                    key={proj.id}
                    className={`flex items-center justify-between gap-3 px-5 py-3.5 transition-colors ${
                      isCurrent ? 'bg-secondary/60' : 'hover:bg-secondary/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProject(proj);
                        onOpenChange(false);
                      }}
                      className="flex-1 text-left overflow-hidden"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {proj.title}
                        </span>
                        <span className="rounded bg-secondary px-1.5 py-0.2 font-code text-[10px] text-muted-foreground">
                          v{proj.versions.length}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {latestVersion?.prompt}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteProject(proj.id)}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-destructive transition-colors"
                      title="Delete app"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

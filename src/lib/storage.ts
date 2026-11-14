import type { AppVersion, GroqModelId, ProjectItem } from './types';

const STORAGE_KEY_PROJECTS = 'prompt2app_projects_v2';
const STORAGE_KEY_ACTIVE_ID = 'prompt2app_active_project_v2';
const MAX_SAVED_PROJECTS = 25;
const MAX_VERSIONS_PER_PROJECT = 15;

export function generateId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function deriveProjectTitle(prompt: string): string {
  const cleaned = prompt
    .replace(
      /^(build|create|make|design|develop|generate)\s+(a|an|the)?\s*/i,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'Untitled App';
  const words = cleaned.split(' ').slice(0, 5).join(' ');
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return capitalized.length > 42
    ? `${capitalized.slice(0, 42)}...`
    : capitalized;
}

function isValidProjectItem(item: unknown): item is ProjectItem {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Partial<ProjectItem>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.versions) &&
    candidate.versions.length > 0 &&
    typeof candidate.versions[0]?.code === 'string'
  );
}

export function loadProjects(): ProjectItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidProjectItem);
  } catch {
    return [];
  }
}

export function saveProjects(projects: ProjectItem[]): void {
  if (typeof window === 'undefined') return;

  let candidate = projects.slice(0, MAX_SAVED_PROJECTS).map((proj) => ({
    ...proj,
    versions: proj.versions.slice(-MAX_VERSIONS_PER_PROJECT),
  }));

  // Gracefully prune oldest projects if localStorage 5MB quota is exceeded
  while (candidate.length > 0) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY_PROJECTS,
        JSON.stringify(candidate)
      );
      return;
    } catch {
      if (candidate.length === 1) {
        // Last resort: keep only the latest version of the active project
        candidate = [
          {
            ...candidate[0],
            versions: candidate[0].versions.slice(-2),
          },
        ];
        try {
          window.localStorage.setItem(
            STORAGE_KEY_PROJECTS,
            JSON.stringify(candidate)
          );
        } catch {
          // Storage completely unavailable
        }
        return;
      }
      candidate = candidate.slice(0, -1);
    }
  }

  try {
    window.localStorage.setItem(STORAGE_KEY_PROJECTS, '[]');
  } catch {
    // Ignore
  }
}

export function loadActiveProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
  } catch {
    return null;
  }
}

export function saveActiveProjectId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      window.localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
    } else {
      window.localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    }
  } catch {
    // Ignore storage errors
  }
}

export function createNewProject(params: {
  prompt: string;
  code: string;
  model: GroqModelId;
  durationMs?: number;
  tokensPerSec?: number;
}): ProjectItem {
  const now = Date.now();
  const versionId = generateId();
  const version: AppVersion = {
    id: versionId,
    versionNumber: 1,
    prompt: params.prompt,
    code: params.code,
    model: params.model,
    createdAt: now,
    durationMs: params.durationMs,
    tokensPerSec: params.tokensPerSec,
  };

  return {
    id: generateId(),
    title: deriveProjectTitle(params.prompt),
    createdAt: now,
    updatedAt: now,
    versions: [version],
    currentVersionId: versionId,
  };
}

export function appendVersionToProject(
  project: ProjectItem,
  params: {
    prompt: string;
    code: string;
    model: GroqModelId;
    durationMs?: number;
    tokensPerSec?: number;
  }
): ProjectItem {
  const now = Date.now();
  const lastNumber =
    project.versions[project.versions.length - 1]?.versionNumber ??
    project.versions.length;
  const nextNumber = lastNumber + 1;
  const versionId = generateId();
  const version: AppVersion = {
    id: versionId,
    versionNumber: nextNumber,
    prompt: params.prompt,
    code: params.code,
    model: params.model,
    createdAt: now,
    durationMs: params.durationMs,
    tokensPerSec: params.tokensPerSec,
  };

  return {
    ...project,
    updatedAt: now,
    versions: [...project.versions, version],
    currentVersionId: versionId,
  };
}

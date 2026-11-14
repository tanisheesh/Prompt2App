export type GroqModelId =
  | 'openai/gpt-oss-120b'
  | 'qwen/qwen3.8-27b'
  | 'openai/gpt-oss-20b';

export interface GroqModelConfig {
  id: GroqModelId;
  name: string;
  provider: string;
  badge: string;
  speed: string;
  description: string;
  maxCompletionTokens: number;
}

export interface AppVersion {
  id: string;
  versionNumber: number;
  prompt: string;
  code: string;
  model: GroqModelId;
  createdAt: number;
  durationMs?: number;
  tokensPerSec?: number;
}

export interface ProjectItem {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  versions: AppVersion[];
  currentVersionId: string;
}

export type StarterCategory =
  | 'Productivity'
  | 'Dashboard'
  | 'Finance'
  | 'Creative';

export interface StarterTemplate {
  id: string;
  title: string;
  category: StarterCategory;
  description: string;
  prompt: string;
  badge: string;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export type WorkspaceTab = 'preview' | 'code' | 'split';

export interface RuntimeErrorItem {
  message: string;
  line?: number;
  column?: number;
  timestamp: number;
}

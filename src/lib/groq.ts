import Groq from 'groq-sdk';
import type { GroqModelConfig, GroqModelId } from './types';

export const DEFAULT_MODEL_ID: GroqModelId = 'openai/gpt-oss-120b';

export const GROQ_MODELS: readonly GroqModelConfig[] = [
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'OpenAI',
    badge: 'Flagship · Best Quality',
    speed: '~500 tok/s',
    description:
      'Flagship 120B open-weight reasoning model. Best for rich UI design, complex interactive logic, and complete single-file apps.',
    maxCompletionTokens: 32768,
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B',
    provider: 'Alibaba Cloud',
    badge: 'Frontend & Design',
    speed: '~450 tok/s',
    description:
      'Frontend specialist with sharp layouts, clean CSS styling, and responsive component structure.',
    maxCompletionTokens: 16384,
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT-OSS 20B',
    provider: 'OpenAI',
    badge: 'Ultra-Fast Turbo',
    speed: '~1,000 tok/s',
    description:
      'Lightning-fast 20B model for rapid prototyping, quick iterations, and instant UI previews.',
    maxCompletionTokens: 32768,
  },
] as const;

export const FALLBACK_MODELS: readonly GroqModelId[] = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
] as const;

export function isValidModelId(model?: string | null): model is GroqModelId {
  return Boolean(model && GROQ_MODELS.some((m) => m.id === model));
}

export function getModelConfig(modelId?: string | null): GroqModelConfig {
  return (
    GROQ_MODELS.find((m) => m.id === modelId) ??
    GROQ_MODELS.find((m) => m.id === DEFAULT_MODEL_ID)!
  );
}

let cachedGroqClient: Groq | null = null;
let cachedApiKey = '';

export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not configured. Add GROQ_API_KEY to your .env.local file.'
    );
  }

  if (!cachedGroqClient || cachedApiKey !== apiKey) {
    cachedGroqClient = new Groq({
      apiKey,
      maxRetries: 2,
      timeout: 55_000,
    });
    cachedApiKey = apiKey;
  }

  return cachedGroqClient;
}

/**
 * Strips `<think>...</think>` reasoning blocks and outer markdown code fences
 * while preserving backticks inside inline JavaScript template literals.
 */
export function cleanHtmlOutput(raw: string): string {
  if (!raw) return '';

  let cleaned = raw;

  // 1. Strip completed <think>...</think> blocks emitted by reasoning models
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // 2. While streaming inside an unclosed <think> block, wait until HTML starts
  if (/<think>/i.test(cleaned) && !/<\/think>/i.test(cleaned)) {
    const docStart = cleaned.search(/<!DOCTYPE\s+html|<html[\s>]/i);
    if (docStart !== -1) {
      cleaned = cleaned.slice(docStart);
    } else {
      return '';
    }
  }

  cleaned = cleaned.trimStart();

  // 3. Strip leading ```html or ``` fence ONLY if the output starts with a fence
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:html|HTML)?[ \t]*\r?\n?/, '');
  }

  // 4. Slice from <!DOCTYPE html> or <html> if any conversational preamble preceded it
  const doctypeIdx = cleaned.search(/<!DOCTYPE\s+html/i);
  const htmlIdx = cleaned.search(/<html[\s>]/i);

  if (doctypeIdx !== -1) {
    cleaned = cleaned.slice(doctypeIdx);
  } else if (htmlIdx !== -1) {
    cleaned = cleaned.slice(htmlIdx);
  }

  // 5. Trim anything after the final </html> tag (including trailing ``` fences)
  const closeHtmlMatches = [...cleaned.matchAll(/<\/html>/gi)];
  if (closeHtmlMatches.length > 0) {
    const lastMatch = closeHtmlMatches[closeHtmlMatches.length - 1];
    if (lastMatch.index !== undefined) {
      cleaned = cleaned.slice(0, lastMatch.index + 7);
    }
  } else {
    cleaned = cleaned.replace(/\r?\n?```\s*$/, '');
  }

  return cleaned.trim();
}

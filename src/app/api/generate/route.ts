import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Stream } from 'groq-sdk/lib/streaming';
import type { ChatCompletionChunk } from 'groq-sdk/resources/chat/completions';
import {
  DEFAULT_MODEL_ID,
  FALLBACK_MODELS,
  getGroqClient,
  getModelConfig,
  isValidModelId,
} from '@/lib/groq';
import { SYSTEM_PROMPT_GENERATE, SYSTEM_PROMPT_REFINE } from '@/lib/prompts';
import type { GroqModelId } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GenerateRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(2, 'Prompt must be at least 2 characters long.')
    .max(12_000, 'Prompt exceeds the 12,000 character limit.'),
  model: z.string().optional(),
  currentCode: z
    .string()
    .max(250_000, 'Current code is too large to refine in a single request.')
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const parsed = GenerateRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request payload.' },
        { status: 400 }
      );
    }

    const { prompt, currentCode } = parsed.data;
    const requestedModel: GroqModelId = isValidModelId(parsed.data.model)
      ? parsed.data.model
      : DEFAULT_MODEL_ID;

    const groq = getGroqClient();

    const isRefinement = Boolean(currentCode && currentCode.trim().length > 0);
    const systemPrompt = isRefinement
      ? SYSTEM_PROMPT_REFINE
      : SYSTEM_PROMPT_GENERATE;

    const userMessageContent = isRefinement
      ? `CURRENT APPLICATION HTML:\n\`\`\`html\n${currentCode}\n\`\`\`\n\nREQUESTED CHANGES / REFINEMENT:\n${prompt}\n\nReturn the COMPLETE updated HTML document starting with <!DOCTYPE html> and ending with </html>.`
      : `Build a complete, self-contained, interactive single-file HTML5 web application for the following specification:\n\n${prompt}`;

    const modelCandidates: GroqModelId[] = [
      requestedModel,
      ...FALLBACK_MODELS.filter((m) => m !== requestedModel),
    ];

    let activeStream: Stream<ChatCompletionChunk> | null = null;
    let usedModel: GroqModelId = requestedModel;
    let lastError: unknown = null;

    for (const candidateModel of modelCandidates) {
      if (req.signal.aborted) {
        return new Response(null, { status: 499 });
      }

      try {
        const config = getModelConfig(candidateModel);
        activeStream = await groq.chat.completions.create(
          {
            model: candidateModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessageContent },
            ],
            temperature: 0.3,
            max_completion_tokens: config.maxCompletionTokens,
            stream: true,
          },
          { signal: req.signal }
        );
        usedModel = candidateModel;
        break;
      } catch (err) {
        if (req.signal.aborted) {
          return new Response(null, { status: 499 });
        }
        console.warn(
          `Groq model ${candidateModel} failed, trying fallback:`,
          err instanceof Error ? err.message : err
        );
        lastError = err;
      }
    }

    if (!activeStream) {
      const msg =
        lastError instanceof Error
          ? lastError.message
          : 'Failed to connect to Groq AI service.';
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const streamRef = activeStream;

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        const onAbort = () => {
          streamRef.controller.abort();
        };
        req.signal.addEventListener('abort', onAbort, { once: true });

        try {
          for await (const chunk of streamRef) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }
          controller.close();
        } catch (streamErr) {
          if (!req.signal.aborted) {
            console.error('Error during Groq stream:', streamErr);
            controller.error(streamErr);
          } else {
            controller.close();
          }
        } finally {
          req.signal.removeEventListener('abort', onAbort);
        }
      },
      cancel() {
        streamRef.controller.abort();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
        'X-Model-Used': usedModel,
      },
    });
  } catch (err) {
    console.error('Error in /api/generate:', err);
    const message =
      err instanceof Error ? err.message : 'Unexpected server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

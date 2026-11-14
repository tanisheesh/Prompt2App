import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getGroqClient } from '@/lib/groq';
import { SYSTEM_PROMPT_ENHANCE } from '@/lib/prompts';

export const runtime = 'nodejs';
export const maxDuration = 30;

const EnhanceSchema = z.object({
  prompt: z.string().trim().min(2).max(4000),
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

    const parsed = EnhanceSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please enter a short idea first to enhance.' },
        { status: 400 }
      );
    }

    const groq = getGroqClient();
    const modelsToTry = [
      'openai/gpt-oss-20b',
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b',
    ] as const;

    let enhancedText = '';
    let lastErr: unknown = null;

    for (const model of modelsToTry) {
      try {
        const completion = await groq.chat.completions.create(
          {
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT_ENHANCE },
              { role: 'user', content: parsed.data.prompt },
            ],
            temperature: 0.45,
            max_completion_tokens: 600,
          },
          { signal: req.signal }
        );

        const raw = completion.choices?.[0]?.message?.content || '';
        enhancedText = raw
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .replace(/^```[\w]*\s*|\s*```$/g, '')
          .replace(/^["']|["']$/g, '')
          .trim();

        if (enhancedText) break;
      } catch (err) {
        if (req.signal.aborted) {
          return new Response(null, { status: 499 });
        }
        lastErr = err;
      }
    }

    if (!enhancedText) {
      throw lastErr || new Error('Failed to enhance prompt.');
    }

    return NextResponse.json({ enhancedPrompt: enhancedText });
  } catch (err) {
    console.error('Error in /api/enhance:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to enhance prompt.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

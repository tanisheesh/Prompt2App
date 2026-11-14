import { NextRequest, NextResponse } from 'next/server';
import { getGroqClient } from '@/lib/groq';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15 MB limit

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: 'No audio file uploaded for transcription.' },
        { status: 400 }
      );
    }

    if (audioFile.size < 300) {
      return NextResponse.json(
        { error: 'Recording was too short. Please speak for at least 1 second.' },
        { status: 400 }
      );
    }

    if (audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: 'Audio recording exceeds the 15 MB size limit.' },
        { status: 413 }
      );
    }

    const groq = getGroqClient();

    const transcription = await groq.audio.transcriptions.create(
      {
        file: audioFile,
        model: 'whisper-large-v3-turbo',
        response_format: 'json',
        temperature: 0.0,
      },
      { signal: req.signal }
    );

    return NextResponse.json({
      text: (transcription.text || '').trim(),
    });
  } catch (err) {
    console.error('Error in /api/transcribe:', err);
    const message =
      err instanceof Error ? err.message : 'Voice transcription failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

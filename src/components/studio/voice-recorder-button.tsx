'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorderButton({
  onTranscript,
  disabled = false,
}: VoiceRecorderButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmountedRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore stop errors on unmount
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSeconds(0);
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ];
      const supportedMime =
        preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';

      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        stopTimer();

        if (unmountedRef.current) return;

        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime });

        if (blob.size < 400) {
          setIsRecording(false);
          return;
        }

        setIsTranscribing(true);
        try {
          const ext = mime.includes('mp4') ? 'm4a' : 'webm';
          const file = new File([blob], `voice-prompt.${ext}`, { type: mime });
          const formData = new FormData();
          formData.append('audio', file);

          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Failed to transcribe audio.');
          }

          if (unmountedRef.current) return;

          if (data.text) {
            onTranscript(data.text);
          } else {
            toast({
              variant: 'destructive',
              title: 'No speech detected',
              description: 'Please speak clearly and try again.',
            });
          }
        } catch (err) {
          if (!unmountedRef.current) {
            toast({
              variant: 'destructive',
              title: 'Voice input failed',
              description:
                err instanceof Error
                  ? err.message
                  : 'Unable to transcribe audio.',
            });
          }
        } finally {
          if (!unmountedRef.current) {
            setIsTranscribing(false);
            setIsRecording(false);
          }
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      toast({
        variant: 'destructive',
        title: 'Microphone permission needed',
        description:
          err instanceof Error
            ? err.message
            : 'Allow microphone access in your browser settings.',
      });
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled || isTranscribing}
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors disabled:opacity-40 ${
        isRecording
          ? 'border-red-500/40 bg-red-500/10 text-red-500'
          : 'border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
      title={isRecording ? 'Stop recording' : 'Voice input'}
      aria-label={isRecording ? 'Stop recording' : 'Voice input'}
    >
      {isTranscribing ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Transcribing...</span>
        </>
      ) : isRecording ? (
        <>
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-code text-xs tabular-nums">
            {formatTime(seconds)}
          </span>
          <Square className="h-2.5 w-2.5 fill-current" />
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}

"use client";

import { useRef, useState } from "react";

// Records a short voice memo and posts it to /api/transcribe, calling
// onTranscribed with the resulting text. Only rendered when voice is enabled
// (OPENAI_API_KEY present) — see CheckInForm.
type State = "idle" | "recording" | "transcribing";

export function MicButton({
  onTranscribed,
  disabled = false,
}: {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  function releaseStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recRef.current = null;
  }

  async function handleStop() {
    setState("transcribing");
    const type = recRef.current?.mimeType || "audio/webm";
    const blob = new Blob(chunksRef.current, { type });
    releaseStream();

    if (blob.size === 0) {
      setError("Didn't catch that — try again.");
      setState("idle");
      return;
    }

    try {
      const form = new FormData();
      form.append("audio", blob, "recording.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Transcription failed.");
        setState("idle");
        return;
      }
      const { text } = await res.json();
      if (typeof text === "string" && text.trim()) onTranscribed(text.trim());
      else setError("Didn't catch any words.");
      setState("idle");
    } catch {
      setError("Transcription failed. Please try again.");
      setState("idle");
    }
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = handleStop;
      recRef.current = rec;
      rec.start();
      setState("recording");
    } catch {
      setError("Couldn't access the microphone.");
      releaseStream();
      setState("idle");
    }
  }

  function stop() {
    // onstop fires handleStop, which transcribes and releases the stream.
    recRef.current?.stop();
  }

  const label =
    state === "recording"
      ? "Stop"
      : state === "transcribing"
        ? "Transcribing…"
        : "Dictate";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={state === "recording" ? stop : start}
        disabled={disabled || state === "transcribing"}
        aria-label={state === "recording" ? "Stop recording" : "Dictate with your voice"}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
          state === "recording"
            ? "bg-rose-gold text-white hover:bg-rose-gold/90"
            : "bg-subtle text-indigo-deep ring-1 ring-indigo-deep/10 hover:bg-surface"
        }`}
      >
        <span aria-hidden>{state === "recording" ? "⏹" : "🎤"}</span>
        {label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {state === "recording" && (
        <span className="text-xs text-rose-gold">Recording… tap to stop</span>
      )}
    </div>
  );
}

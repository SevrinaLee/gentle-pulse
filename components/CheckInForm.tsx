"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoodPicker } from "./MoodPicker";

export function CheckInForm() {
  const router = useRouter();
  const [mood, setMood] = useState("😩");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setValidationError(null);

    if (!text.trim()) {
      setValidationError("Tell me what happened — even one word works");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, raw_text: text }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setText("");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm p-5 space-y-4"
    >
      <MoodPicker value={mood} onChange={setMood} />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What stole your time today?"
        rows={3}
        className="w-full rounded-xl border border-indigo-deep/15 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold resize-none"
      />

      {validationError && (
        <p className="text-sm text-red-600">{validationError}</p>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-deep text-off-white text-sm font-medium hover:bg-indigo-deep-light transition disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Submit"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SighButton() {
  const router = useRouter();
  const [sighId, setSighId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTap() {
    setError(null);
    try {
      const res = await fetch("/api/sigh-events", { method: "POST" });
      if (!res.ok) {
        setError("Couldn't log that. Try again.");
        return;
      }
      const body = await res.json();
      setSighId(body.sighEvent.id);
      setNote("");
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  async function handleSaveNote() {
    if (!sighId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sigh-events/${sighId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follow_up_note: note }),
      });
      if (res.ok) {
        setSighId(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleTap}
        aria-label="Log a sigh"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-rose-gold text-white text-2xl shadow-lg flex items-center justify-center hover:scale-105 transition"
      >
        😮‍💨
      </button>

      {error && (
        <div className="fixed bottom-24 right-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 max-w-xs">
          {error}
        </div>
      )}

      {sighId && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white text-indigo-deep rounded-2xl p-5 w-full max-w-sm space-y-3">
            <h3 className="font-medium text-indigo-deep">
              Want to say more about that?
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Optional — what was it?"
              className="w-full rounded-xl border border-indigo-deep/15 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setSighId(null)}
                className="px-4 py-2 rounded-xl text-sm text-indigo-deep/60 hover:bg-off-white"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={saving || !note.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-deep text-off-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

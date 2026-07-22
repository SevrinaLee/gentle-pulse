"use client";

import { useState } from "react";

export function DigestToggle({ initialOptIn }: { initialOptIn: boolean }) {
  const [optIn, setOptIn] = useState(initialOptIn);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(next: boolean) {
    setSaving(true);
    setError(null);
    const prev = optIn;
    setOptIn(next); // optimistic
    try {
      const res = await fetch("/api/account/digest", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opt_in: next }),
      });
      if (!res.ok) {
        setOptIn(prev); // revert
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Couldn't save. Please try again.");
      }
    } catch {
      setOptIn(prev);
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center justify-between gap-4 cursor-pointer">
        <span className="text-sm text-indigo-deep">
          Email me a weekly summary of my biggest time drain and one suggestion.
        </span>
        <input
          type="checkbox"
          checked={optIn}
          disabled={saving}
          onChange={(e) => toggle(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-rose-gold disabled:opacity-50"
        />
      </label>
      <p className="text-xs text-indigo-deep/50">
        Sent Sunday mornings. Turn it off any time.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

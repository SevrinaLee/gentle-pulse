"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm text-indigo-deep/70">
        Name / Nickname
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          maxLength={60}
          required
          className="mt-1 w-full rounded-xl border border-indigo-deep/15 p-3 text-sm text-indigo-deep focus:outline-none focus:ring-2 focus:ring-rose-gold"
        />
      </label>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
          {error}
        </div>
      )}
      {saved && !error && (
        <p className="text-sm text-green-700">Saved.</p>
      )}

      <button
        type="submit"
        disabled={saving || name.trim() === initialName}
        className="px-4 py-2 rounded-xl bg-brand text-off-white text-sm font-medium hover:bg-brand-light transition disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}

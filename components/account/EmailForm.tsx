"use client";

import { useState } from "react";

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(currentEmail);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
      setEditing(false);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (!editing) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-indigo-deep/70">Email</p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-indigo-deep">{currentEmail}</p>
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setSent(false);
              setError(null);
            }}
            className="text-sm text-rose-gold hover:underline shrink-0"
          >
            Change
          </button>
        </div>
        {sent && (
          <p className="text-sm text-green-700">
            Check both your old and new inbox for confirmation links.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm text-indigo-deep/70">
        New email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-indigo-deep/15 p-3 text-sm text-indigo-deep focus:outline-none focus:ring-2 focus:ring-rose-gold"
        />
      </label>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={sending || email.trim() === currentEmail}
          className="px-4 py-2 rounded-xl bg-brand text-off-white text-sm font-medium hover:bg-brand-light transition disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send confirmation"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setEmail(currentEmail);
            setError(null);
          }}
          className="px-4 py-2 rounded-xl text-sm text-indigo-deep/60 hover:bg-subtle"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

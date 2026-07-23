"use client";

import { useState } from "react";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-red-600 hover:underline"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-800 font-medium">
        This permanently deletes your account and all your check-ins, tags,
        patterns, and suggestions. This cannot be undone.
      </p>
      <label className="block text-sm text-red-800">
        Type <span className="font-mono font-semibold">DELETE</span> to confirm
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="mt-1 w-full rounded-xl border border-red-300 p-3 text-sm text-indigo-deep focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </label>

      {error && (
        <div className="rounded-lg bg-surface border border-red-200 text-red-700 text-sm p-3">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={confirmText !== "DELETE" || deleting}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-40"
        >
          {deleting ? "Deleting…" : "Permanently delete my account"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmText("");
            setError(null);
          }}
          className="px-4 py-2 rounded-xl text-sm text-indigo-deep/60 hover:bg-surface"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

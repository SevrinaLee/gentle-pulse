"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Something went wrong. Please try again.");
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStatus("idle");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <Link href="/login" className="text-sm text-rose-gold hover:underline">
            ← Back to log in
          </Link>
          <h1 className="text-2xl font-semibold text-indigo-deep">Forgot password</h1>
          <p className="text-sm text-indigo-deep/60">
            We&apos;ll email you a link to set a new one.
          </p>
        </div>

        {status === "sent" ? (
          <div className="bg-surface rounded-2xl shadow-sm p-6 text-center space-y-2">
            <p className="text-2xl">📬</p>
            <p className="text-sm text-indigo-deep">
              If an account exists for <span className="font-medium">{email}</span>,
              a reset link is on its way.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-surface rounded-2xl shadow-sm p-6 space-y-4"
          >
            <label className="block text-sm text-indigo-deep/70">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-indigo-deep/15 p-3 text-sm text-indigo-deep focus:outline-none focus:ring-2 focus:ring-rose-gold"
              />
            </label>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full px-5 py-2.5 rounded-xl bg-brand text-off-white text-sm font-medium hover:bg-brand-light transition disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "signup"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="text-sm text-rose-gold hover:underline">
            ← Back to demo
          </Link>
          <h1 className="text-2xl font-semibold text-indigo-deep">Gentle Pulse</h1>
          <p className="text-sm text-indigo-deep/60">
            {mode === "login"
              ? "Log in to your private friction log."
              : "Create an account to start your own private friction log."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-2xl shadow-sm p-6 space-y-4"
        >
          <div className="flex gap-1 bg-subtle rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${
                mode === "login"
                  ? "bg-surface text-indigo-deep shadow-sm"
                  : "text-indigo-deep/50"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-surface text-indigo-deep shadow-sm"
                  : "text-indigo-deep/50"
              }`}
            >
              Sign up
            </button>
          </div>

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

          <label className="block text-sm text-indigo-deep/70">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="mt-1 w-full rounded-xl border border-indigo-deep/15 p-3 text-sm text-indigo-deep focus:outline-none focus:ring-2 focus:ring-rose-gold"
            />
          </label>

          {mode === "login" && (
            <div className="text-right -mt-2">
              <Link
                href="/forgot-password"
                className="text-xs text-rose-gold hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-5 py-2.5 rounded-xl bg-brand text-off-white text-sm font-medium hover:bg-brand-light transition disabled:opacity-60"
          >
            {submitting
              ? mode === "login"
                ? "Logging in…"
                : "Creating account…"
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}

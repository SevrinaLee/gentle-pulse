"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD_LENGTH = 8;

// Supabase's hosted email-verify redirect lands here with the session
// encoded as a URL HASH FRAGMENT (#access_token=...&refresh_token=...) —
// see supabase/config.toml for why (custom templates are blocked on this
// plan's default email provider). Fragments never reach the server, so this
// has to be parsed and exchanged for a session client-side.
type Status = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function establishSession() {
      const hash = window.location.hash;
      if (hash.includes("access_token")) {
        const params = new URLSearchParams(hash.slice(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          // Strip the token fragment from the URL/history either way.
          window.history.replaceState(null, "", window.location.pathname);
          if (!setErr) {
            setStatus("ready");
            return;
          }
        }
      }

      // No fragment (or it failed) — maybe a session already exists from a
      // previous step on this page.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setStatus(user ? "ready" : "invalid");
    }

    establishSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(updateErr.message || "Could not update your password.");
        return;
      }
      setStatus("done");
      setTimeout(() => router.push("/"), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-indigo-deep">Reset password</h1>
        </div>

        {status === "checking" && (
          <p className="text-center text-sm text-indigo-deep/60">Verifying your link…</p>
        )}

        {status === "invalid" && (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-3">
            <p className="text-sm text-indigo-deep">
              This link is invalid or has expired.
            </p>
            <a href="/forgot-password" className="text-sm text-rose-gold hover:underline">
              Request a new one
            </a>
          </div>
        )}

        {status === "done" && (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-2">
            <p className="text-2xl">✅</p>
            <p className="text-sm text-indigo-deep">Password updated. Redirecting…</p>
          </div>
        )}

        {status === "ready" && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm p-6 space-y-4"
          >
            <label className="block text-sm text-indigo-deep/70">
              New password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1 w-full rounded-xl border border-indigo-deep/15 p-3 text-sm text-indigo-deep focus:outline-none focus:ring-2 focus:ring-rose-gold"
              />
            </label>
            <label className="block text-sm text-indigo-deep/70">
              Confirm new password
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
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
              disabled={saving}
              className="w-full px-5 py-2.5 rounded-xl bg-indigo-deep text-off-white text-sm font-medium hover:bg-indigo-deep-light transition disabled:opacity-60"
            >
              {saving ? "Saving…" : "Set new password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

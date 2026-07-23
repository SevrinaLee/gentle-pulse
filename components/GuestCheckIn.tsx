"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoodPicker } from "./MoodPicker";
import { GUEST_CHECKIN_KEY, type PendingCheckIn } from "@/lib/guest";

// Lets an anonymous visitor log their first real frustration before committing
// to an account. The entry is stashed in localStorage and replayed into their
// account right after signup (see GuestCheckInMigrator) — lowering the
// commitment barrier from "sign up, then try" to "try, then sign up".
export function GuestCheckIn() {
  const router = useRouter();
  const [mood, setMood] = useState("😩");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!text.trim()) {
      setError("Tell me what happened — even one word works");
      return;
    }
    const pending: PendingCheckIn = { mood, raw_text: text.trim() };
    try {
      localStorage.setItem(GUEST_CHECKIN_KEY, JSON.stringify(pending));
    } catch {
      // Private-mode / storage disabled — fall through to signup anyway.
    }
    router.push("/login");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface rounded-2xl shadow-sm p-5 space-y-4"
    >
      <div>
        <h2 className="font-semibold text-indigo-deep">
          Try it — log your first frustration
        </h2>
        <p className="text-sm text-indigo-deep/60">
          We&apos;ll save it to your account when you sign up.
        </p>
      </div>

      <MoodPicker value={mood} onChange={setMood} />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What stole your time today?"
        rows={3}
        className="w-full rounded-xl border border-indigo-deep/15 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold resize-none"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand text-off-white text-sm font-medium hover:bg-brand-light transition"
      >
        Save &amp; sign up
      </button>
    </form>
  );
}

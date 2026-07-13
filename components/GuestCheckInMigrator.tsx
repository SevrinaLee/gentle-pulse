"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { GUEST_CHECKIN_KEY, type PendingCheckIn } from "@/lib/guest";

// Rendered only on the signed-in home. On mount, if a guest check-in was
// stashed before signup, replay it into the now-authenticated account.
export function GuestCheckInMigrator() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React's double-invoke in dev StrictMode
    ran.current = true;

    const raw = localStorage.getItem(GUEST_CHECKIN_KEY);
    if (!raw) return;
    // Claim it immediately so a concurrent mount can't double-submit; restore
    // on failure so a transient error doesn't lose the entry.
    localStorage.removeItem(GUEST_CHECKIN_KEY);

    let pending: PendingCheckIn;
    try {
      pending = JSON.parse(raw);
    } catch {
      return;
    }
    if (!pending?.raw_text) return;

    (async () => {
      try {
        const res = await fetch("/api/check-ins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mood: pending.mood, raw_text: pending.raw_text }),
        });
        if (res.ok) {
          router.refresh();
        } else {
          localStorage.setItem(GUEST_CHECKIN_KEY, raw);
        }
      } catch {
        localStorage.setItem(GUEST_CHECKIN_KEY, raw);
      }
    })();
  }, [router]);

  return null;
}

"use client";

import { useEffect, useState } from "react";

type Pref = "light" | "dark" | "system";
const KEY = "gp_theme";

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function apply(pref: Pref) {
  const dark = pref === "dark" || (pref === "system" && systemPrefersDark());
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

const OPTIONS: { value: Pref; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "system", label: "System", icon: "🖥️" },
];

export function ThemeToggle() {
  // Default matches the pre-paint script's fallback ("system").
  const [pref, setPref] = useState<Pref>("system");

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Pref | null) ?? "system";
    setPref(stored);
    // Keep "system" live if the OS theme changes while the app is open.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(KEY) as Pref | null) === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function choose(next: Pref) {
    setPref(next);
    localStorage.setItem(KEY, next);
    apply(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex gap-1 rounded-xl bg-subtle p-1"
    >
      {OPTIONS.map((o) => {
        const active = pref === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => choose(o.value)}
            className={`flex-1 py-1.5 rounded-lg text-sm transition ${
              active
                ? "bg-surface shadow-sm"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            <span aria-hidden>{o.icon}</span>
          </button>
        );
      })}
    </div>
  );
}

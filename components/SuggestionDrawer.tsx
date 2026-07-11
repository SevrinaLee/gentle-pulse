"use client";

import { useState } from "react";
import type { Suggestion } from "@/lib/types";

type Tab = "prompt" | "template" | "n8n";

export function SuggestionDrawer({
  suggestion,
  canWrite = true,
  onClose,
  onIgnored,
}: {
  suggestion: Suggestion;
  canWrite?: boolean;
  onClose: () => void;
  onIgnored: () => void;
}) {
  const [tab, setTab] = useState<Tab>("prompt");
  const [copied, setCopied] = useState(false);
  const [ignoring, setIgnoring] = useState(false);

  async function handleIgnore() {
    setIgnoring(true);
    try {
      const res = await fetch(`/api/suggestions/${suggestion.id}/ignore`, {
        method: "POST",
      });
      if (res.ok) onIgnored();
    } finally {
      setIgnoring(false);
    }
  }

  async function handleCopy() {
    if (!suggestion.chatgpt_prompt) return;
    await navigator.clipboard.writeText(suggestion.chatgpt_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white text-indigo-deep rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-indigo-deep">{suggestion.headline}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-indigo-deep/40 hover:text-indigo-deep"
          >
            ✕
          </button>
        </div>

        {suggestion.body && (
          <p className="text-sm text-indigo-deep/70">{suggestion.body}</p>
        )}

        <div className="flex gap-2 flex-wrap text-xs">
          {suggestion.time_saved_minutes != null && (
            <span className="px-2 py-1 rounded-full bg-rose-gold-light text-indigo-deep">
              Saves ~{Math.round(suggestion.time_saved_minutes / 60)}h/wk
            </span>
          )}
          {suggestion.difficulty_stars != null && (
            <span className="px-2 py-1 rounded-full bg-off-white text-indigo-deep/70">
              Difficulty {"★".repeat(suggestion.difficulty_stars)}
              {"☆".repeat(5 - suggestion.difficulty_stars)}
            </span>
          )}
          {suggestion.energy_saved_stars != null && (
            <span className="px-2 py-1 rounded-full bg-off-white text-indigo-deep/70">
              Energy saved {"★".repeat(suggestion.energy_saved_stars)}
              {"☆".repeat(5 - suggestion.energy_saved_stars)}
            </span>
          )}
        </div>

        <div className="flex gap-1 border-b border-indigo-deep/10">
          {(
            [
              ["prompt", "ChatGPT Prompt"],
              ["template", "Template"],
              ["n8n", "n8n Link"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-2 text-sm ${
                tab === key
                  ? "border-b-2 border-rose-gold text-indigo-deep font-medium"
                  : "text-indigo-deep/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-24">
          {tab === "prompt" &&
            (suggestion.chatgpt_prompt ? (
              <div className="space-y-2">
                <p className="text-sm bg-off-white rounded-xl p-3 whitespace-pre-wrap">
                  {suggestion.chatgpt_prompt}
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-sm px-3 py-1.5 rounded-lg bg-indigo-deep text-off-white"
                >
                  {copied ? "Copied!" : "Copy prompt"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-indigo-deep/40">No prompt for this one.</p>
            ))}

          {tab === "template" &&
            (suggestion.template_text ? (
              <p className="text-sm bg-off-white rounded-xl p-3 whitespace-pre-wrap">
                {suggestion.template_text}
              </p>
            ) : (
              <p className="text-sm text-indigo-deep/40">
                No template for this one yet.
              </p>
            ))}

          {tab === "n8n" &&
            (suggestion.n8n_link ? (
              <a
                href={suggestion.n8n_link}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-rose-gold underline"
              >
                {suggestion.n8n_link}
              </a>
            ) : (
              <p className="text-sm text-indigo-deep/40">
                No automation link for this one yet.
              </p>
            ))}
        </div>

        {canWrite && (
          <button
            type="button"
            onClick={handleIgnore}
            disabled={ignoring}
            className="w-full text-sm text-indigo-deep/50 hover:text-red-500 py-2"
          >
            {ignoring ? "Ignoring…" : "Ignore this suggestion"}
          </button>
        )}
      </div>
    </div>
  );
}

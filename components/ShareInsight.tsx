"use client";

import { useCallback, useEffect, useState } from "react";
import type { Pattern, Suggestion } from "@/lib/types";
import {
  renderShareImage,
  canvasToPngBlob,
} from "@/lib/share-image";

export function ShareInsight({
  pattern,
  suggestion,
}: {
  pattern: Pattern;
  suggestion: Suggestion | null;
}) {
  const [open, setOpen] = useState(false);
  const [includeSuggestion, setIncludeSuggestion] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [canShareFiles, setCanShareFiles] = useState(false);

  // Regenerate the preview whenever the modal opens or the toggle changes.
  useEffect(() => {
    if (!open) return;
    const canvas = renderShareImage({
      category: pattern.category,
      occurrenceCount: pattern.occurrence_count,
      hoursPerWeek: pattern.estimated_hours_per_week,
      suggestionHeadline:
        includeSuggestion && suggestion ? suggestion.headline : null,
    });
    setDataUrl(canvas.toDataURL("image/png"));
  }, [open, includeSuggestion, pattern, suggestion]);

  useEffect(() => {
    // Feature-detect file sharing once, on the client.
    try {
      const probe = new File([new Blob()], "probe.png", { type: "image/png" });
      setCanShareFiles(
        typeof navigator !== "undefined" &&
          !!navigator.canShare &&
          navigator.canShare({ files: [probe] }),
      );
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  const buildCanvas = useCallback(
    () =>
      renderShareImage({
        category: pattern.category,
        occurrenceCount: pattern.occurrence_count,
        hoursPerWeek: pattern.estimated_hours_per_week,
        suggestionHeadline:
          includeSuggestion && suggestion ? suggestion.headline : null,
      }),
    [includeSuggestion, pattern, suggestion],
  );

  async function handleDownload() {
    const url = buildCanvas().toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "gentle-pulse-biggest-drain.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleShare() {
    const blob = await canvasToPngBlob(buildCanvas());
    if (!blob) return;
    const file = new File([blob], "gentle-pulse-biggest-drain.png", {
      type: "image/png",
    });
    try {
      await navigator.share({
        files: [file],
        title: "My biggest time drain",
        text: `My biggest time drain this week: ${pattern.category}.`,
      });
    } catch {
      // User cancelled or share failed — no-op; download is still available.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-off-white/10 text-off-white text-sm font-medium hover:bg-off-white/20 transition"
      >
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-surface text-indigo-deep rounded-2xl p-5 w-full max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Share your biggest drain</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-indigo-deep/40 hover:text-indigo-deep"
              >
                ✕
              </button>
            </div>

            {dataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dataUrl}
                alt="Preview of your shareable biggest-drain card"
                className="w-full rounded-xl border border-indigo-deep/10"
              />
            )}

            <label className="flex items-center gap-2 text-sm text-indigo-deep/80">
              <input
                type="checkbox"
                checked={includeSuggestion}
                onChange={(e) => setIncludeSuggestion(e.target.checked)}
                disabled={!suggestion}
                className="accent-rose-gold"
              />
              Include the suggested fix
              {!suggestion && (
                <span className="text-indigo-deep/40">(none yet)</span>
              )}
            </label>

            <p className="text-xs text-indigo-deep/50">
              Only this summary is shared — never your check-in text.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 px-4 py-2 rounded-xl bg-brand text-off-white text-sm font-medium hover:bg-brand-light transition"
              >
                Download
              </button>
              {canShareFiles && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 px-4 py-2 rounded-xl bg-rose-gold text-white text-sm font-medium hover:bg-rose-gold/90 transition"
                >
                  Share…
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Client-side renderer for the shareable "biggest drain" image. Draws a
// branded square card onto a canvas so the whole thing stays on-device — no
// server round-trip, and by construction it can only include the fields passed
// here (never the raw check-in text).

export interface ShareImageOptions {
  category: string;
  occurrenceCount: number;
  hoursPerWeek: number | null;
  /** Optional — only included when the user opts in. Template copy, not user text. */
  suggestionHeadline?: string | null;
}

const SIZE = 1080; // square, good for social
const INDIGO = "#2e2360";
const INDIGO_LIGHT = "#4b3d8f";
const ROSE = "#b76e79";
const OFF_WHITE = "#faf7f2";

// Wrap `text` to at most `maxWidth`, returning the lines. `ctx.font` must be set
// before calling.
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function renderShareImage(opts: ShareImageOptions): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Background + a soft accent bar.
  ctx.fillStyle = INDIGO;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = INDIGO_LIGHT;
  ctx.fillRect(0, 0, SIZE, 12);

  const margin = 96;
  const maxTextWidth = SIZE - margin * 2;
  const sans =
    "-apple-system, 'Segoe UI', system-ui, Roboto, Helvetica, Arial, sans-serif";

  // Eyebrow label.
  ctx.fillStyle = "rgba(250,247,242,0.6)";
  ctx.font = `600 34px ${sans}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("MY BIGGEST TIME DRAIN THIS WEEK", margin, 220);

  // Category — the headline stat. Wrap if long.
  ctx.fillStyle = OFF_WHITE;
  ctx.font = `700 104px ${sans}`;
  const catLines = wrapLines(ctx, opts.category, maxTextWidth);
  let y = 360;
  for (const line of catLines) {
    ctx.fillText(line, margin, y);
    y += 118;
  }

  // Sub-stat: occurrences + hours.
  const hrs =
    opts.hoursPerWeek != null
      ? `${opts.hoursPerWeek} ${opts.hoursPerWeek === 1 ? "hr" : "hrs"}/week`
      : null;
  const checkins = `${opts.occurrenceCount} check-in${opts.occurrenceCount === 1 ? "" : "s"}`;
  ctx.fillStyle = "rgba(250,247,242,0.85)";
  ctx.font = `500 46px ${sans}`;
  ctx.fillText(hrs ? `${checkins}  ·  ${hrs}` : checkins, margin, y + 24);
  y += 24;

  // Optional suggestion headline (opt-in only).
  if (opts.suggestionHeadline) {
    ctx.fillStyle = ROSE;
    ctx.font = `600 44px ${sans}`;
    const sugLines = wrapLines(ctx, opts.suggestionHeadline, maxTextWidth);
    y += 96;
    for (const line of sugLines) {
      ctx.fillText(line, margin, y);
      y += 58;
    }
  }

  // Footer wordmark.
  ctx.fillStyle = ROSE;
  ctx.font = `700 42px ${sans}`;
  ctx.fillText("Gentle Pulse", margin, SIZE - margin);
  ctx.fillStyle = "rgba(250,247,242,0.5)";
  ctx.font = `400 32px ${sans}`;
  ctx.fillText("Find your biggest time drains", margin, SIZE - margin + 44);

  return canvas;
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

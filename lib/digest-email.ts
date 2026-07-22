// Pure weekly-digest email renderer — no I/O or runtime imports, so it can be
// compiled and unit-tested standalone.

export interface DigestData {
  displayName: string;
  category: string;
  occurrenceCount: number;
  hoursPerWeek: number | null;
  suggestionHeadline: string | null;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export function renderDigestEmail(d: DigestData): {
  subject: string;
  html: string;
  text: string;
} {
  const hrs =
    d.hoursPerWeek != null
      ? `${d.hoursPerWeek} ${d.hoursPerWeek === 1 ? "hr" : "hrs"}/week`
      : null;
  const stat = hrs
    ? `${d.occurrenceCount} check-ins · ${hrs}`
    : `${d.occurrenceCount} check-ins`;

  const subject = `Your biggest time drain this week: ${d.category}`;

  const text = [
    `Hi ${d.displayName},`,
    ``,
    `Your biggest time drain this week was ${d.category} (${stat}).`,
    d.suggestionHeadline ? `\nOne thing to try: ${d.suggestionHeadline}` : "",
    ``,
    `Open Gentle Pulse to see the full breakdown.`,
    ``,
    `— Gentle Pulse`,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;background:#faf7f2;font-family:-apple-system,'Segoe UI',system-ui,sans-serif;color:#2e2360;">
  <div style="max-width:520px;margin:0 auto;padding:24px;">
    <p style="font-size:15px;">Hi ${escapeHtml(d.displayName)},</p>
    <div style="background:#2e2360;color:#faf7f2;border-radius:16px;padding:24px;margin:16px 0;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:rgba(250,247,242,.6);">Your biggest drain this week</p>
      <h1 style="margin:0 0 8px;font-size:26px;">${escapeHtml(d.category)}</h1>
      <p style="margin:0;font-size:15px;color:rgba(250,247,242,.85);">${escapeHtml(stat)}</p>
      ${
        d.suggestionHeadline
          ? `<p style="margin:16px 0 0;font-size:15px;color:#e8c4c4;">💡 ${escapeHtml(d.suggestionHeadline)}</p>`
          : ""
      }
    </div>
    <p style="font-size:14px;color:rgba(46,35,96,.7);">Open Gentle Pulse to see the full breakdown and copy the fix.</p>
    <p style="font-size:12px;color:rgba(46,35,96,.5);margin-top:24px;">You're getting this because you turned on the weekly digest. Turn it off any time in your account settings.</p>
  </div>
</body></html>`;

  return { subject, html, text };
}

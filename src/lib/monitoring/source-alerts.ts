import type { FreshnessReport } from "@/lib/monitoring/freshness";

export type SourceHealthAlertPayload = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function parseOpsEmailRecipients(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

export function summarizeSourceHealth(report: FreshnessReport) {
  const lines: string[] = [
    `overall=${report.overall}`,
    `ingest=${report.ingest.status}${report.ingest.last_error ? ` (${report.ingest.last_error})` : ""}`,
    `alert_evaluator=${report.alert_evaluator.status}${report.alert_evaluator.last_error ? ` (${report.alert_evaluator.last_error})` : ""}`,
    `snapshots=${report.data_snapshots.status}`,
  ];

  for (const [driverKey, driver] of Object.entries(report.evidence_sources.drivers)) {
    if (driver.status === "healthy") continue;
    const details = [
      driver.missing_series.length > 0
        ? `missing=${driver.missing_series.join("|")}`
        : null,
      driver.stale_series.length > 0
        ? `stale=${driver.stale_series.join("|")}`
        : null,
      driver.age_minutes !== null ? `age=${driver.age_minutes}m` : null,
    ].filter(Boolean);
    lines.push(`${driverKey}=${driver.status}${details.length > 0 ? ` (${details.join(", ")})` : ""}`);
  }

  return lines;
}

export function buildSourceHealthAlert(
  report: FreshnessReport,
): SourceHealthAlertPayload {
  const lines = summarizeSourceHealth(report);
  const subject = `[Dralvo] Source health ${report.overall.toUpperCase()}`;
  const text = [
    "Dralvo source health needs attention.",
    "",
    ...lines,
    "",
    "Open /api/health with CRON_SECRET for full details.",
  ].join("\n");
  const htmlLines = lines
    .map((line) => `<li><code>${escapeHtml(line)}</code></li>`)
    .join("");

  return {
    subject,
    text,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#060609;color:#EDE8E0;font-family:monospace;padding:24px;">
  <div style="max-width:720px;margin:0 auto;background:#0C0C14;border:1px solid #1A1A2A;border-radius:12px;padding:24px;">
    <h2 style="color:#D4A843;margin:0 0 16px;font-size:18px;">Dralvo Source Health ${escapeHtml(report.overall.toUpperCase())}</h2>
    <p style="color:#9A958A;font-size:13px;">Source health needs operator attention.</p>
    <ul style="line-height:1.8;padding-left:20px;">${htmlLines}</ul>
    <p style="margin-top:20px;font-size:11px;color:#5C5852;">Open /api/health with CRON_SECRET for full details.</p>
  </div>
</body>
</html>`.trim(),
  };
}

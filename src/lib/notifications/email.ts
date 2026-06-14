import nodemailer from "nodemailer";
import { DEFAULT_LOCALE, NOTIFICATION_COPY, type SupportedLocale } from "@/lib/i18n";

let transport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter {
  if (transport) return transport;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.");
  }

  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transport;
}

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const smtp = getTransport();
    const from = process.env.SMTP_FROM ?? "Dralvo <alerts@dralvo.com>";

    await smtp.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    return true;
  } catch (err) {
    console.error("[email] Failed to send:", (err as Error).message);
    return false;
  }
}

export function buildAlertEmail(params: {
  indicatorName: string;
  conditionText: string;
  triggeredValue: string;
  alertId: string;
  locale?: SupportedLocale;
}): EmailPayload {
  const copy = NOTIFICATION_COPY[params.locale ?? DEFAULT_LOCALE];
  const subject = `${copy.subjectPrefix}: ${params.indicatorName} ${params.conditionText}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#060609;color:#EDE8E0;font-family:monospace;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#0C0C14;border:1px solid #1A1A2A;border-radius:12px;padding:24px;">
    <h2 style="color:#D4A843;margin:0 0 16px;font-size:18px;">${copy.triggeredTitle}</h2>
    <p style="margin:0 0 8px;color:#9A958A;font-size:13px;">${copy.indicator}</p>
    <p style="margin:0 0 16px;font-size:15px;font-weight:600;">${params.indicatorName}</p>
    <p style="margin:0 0 8px;color:#9A958A;font-size:13px;">${copy.condition}</p>
    <p style="margin:0 0 16px;font-size:15px;color:#F0C85A;">${params.conditionText}</p>
    <p style="margin:0 0 8px;color:#9A958A;font-size:13px;">${copy.currentValue}</p>
    <p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#EDE8E0;">${params.triggeredValue}</p>
    <a href="https://www.dralvo.com/dashboard" style="display:inline-block;background:#D4A843;color:#060609;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">${copy.viewDashboard}</a>
    <p style="margin:24px 0 0;font-size:11px;color:#5C5852;">${copy.alertId}: ${params.alertId}</p>
  </div>
</body>
</html>`.trim();

  return { to: "", subject, html };
}

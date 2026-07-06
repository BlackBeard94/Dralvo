import { DEFAULT_LOCALE, NOTIFICATION_COPY, type SupportedLocale } from "@/lib/i18n";

const TELEGRAM_API = "https://api.telegram.org";

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");
  return token;
}

/** Inline URL button rows for sendTelegramMessage (each inner array = one row). */
export type InlineUrlButton = { text: string; url: string };

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  buttons?: InlineUrlButton[][],
  /** Send via a specific bot token instead of the default customer bot — e.g.
   *  the owner-notification bot for license-approval messages. */
  tokenOverride?: string,
): Promise<boolean> {
  try {
    const token = tokenOverride || botToken();
    const url = `${TELEGRAM_API}/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...(buttons && buttons.length
          ? { reply_markup: { inline_keyboard: buttons } }
          : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      console.error("[telegram] Send failed:", body);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[telegram] Send error:", (err as Error).message);
    return false;
  }
}

export function buildAlertTelegramMessage(params: {
  indicatorName: string;
  conditionText: string;
  triggeredValue: string;
  locale?: SupportedLocale;
}): string {
  const copy = NOTIFICATION_COPY[params.locale ?? DEFAULT_LOCALE];

  return [
    `<b>${copy.triggeredTitle}</b>`,
    ``,
    `<b>${copy.indicator}:</b> ${params.indicatorName}`,
    `<b>${copy.condition}:</b> ${params.conditionText}`,
    `<b>${copy.currentValue}:</b> ${params.triggeredValue}`,
    ``,
    `<a href="https://www.dralvo.com/dashboard">${copy.viewDashboard}</a>`,
  ].join("\n");
}

export function generateConnectCode(userId: string): string {
  const hash = userId.replace(/-/g, "").slice(0, 12);
  return `DRALVO-${hash.slice(0, 8).toUpperCase()}`;
}

export async function verifyBotToken(): Promise<{ ok: boolean; username?: string }> {
  try {
    const url = `${TELEGRAM_API}/bot${botToken()}/getMe`;
    const res = await fetch(url);
    const body = await res.json();
    if (body.ok) {
      return { ok: true, username: body.result.username };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function setWebhook(baseUrl: string): Promise<boolean> {
  try {
    const url = `${TELEGRAM_API}/bot${botToken()}/setWebhook`;
    const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        ...(secret ? { secret_token: secret } : {}),
      }),
    });
    const body = await res.json();
    return body.ok === true;
  } catch (err) {
    console.error("[telegram] setWebhook error:", (err as Error).message);
    return false;
  }
}

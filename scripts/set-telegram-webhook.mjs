import { readFile } from "node:fs/promises";
import path from "node:path";

function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

const envPath = path.resolve(process.cwd(), ".env.local");
const env = parseEnv(await readFile(envPath, "utf8"));

const botToken = env.TELEGRAM_BOT_TOKEN;
const siteUrl = (getArg("site") ?? env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
const webhookSecret = getArg("secret") ?? env.TELEGRAM_WEBHOOK_SECRET;

if (!botToken) {
  console.error("TELEGRAM_BOT_TOKEN is missing in .env.local.");
  process.exit(1);
}

if (!siteUrl || siteUrl.startsWith("http://localhost")) {
  console.error("Production site URL is required. Use --site=https://www.dralvo.com");
  process.exit(1);
}

const telegramApi = `https://api.telegram.org/bot${botToken}`;
const webhookUrl = `${siteUrl}/api/telegram/webhook`;

async function callTelegram(method, body) {
  const res = await fetch(`${telegramApi}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.description ?? `${method} failed`);
  }
  return json.result;
}

const me = await callTelegram("getMe");
console.log(`Bot verified: @${me.username}`);

const before = await callTelegram("getWebhookInfo");
console.log(`Previous webhook: ${before.url || "(none)"}`);

const payload = {
  url: webhookUrl,
  allowed_updates: ["message"],
};

if (webhookSecret) {
  payload.secret_token = webhookSecret;
}

await callTelegram("setWebhook", payload);

const after = await callTelegram("getWebhookInfo");
console.log(`Webhook set: ${after.url}`);
console.log(`Pending updates: ${after.pending_update_count}`);
if (after.last_error_message) {
  console.log(`Last error: ${after.last_error_message}`);
}


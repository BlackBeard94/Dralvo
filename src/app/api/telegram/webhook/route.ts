import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type NotificationPrefs = {
  email?: boolean;
  telegram?: boolean;
  in_app?: boolean;
  telegram_connect_code?: string;
  telegram_connect_expires_at?: string;
};

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(req, "telegram:webhook"),
    limit: 300,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  // Fail closed: if no secret is configured, reject rather than accepting
  // unsigned requests from anyone (contrast with the old behaviour that only
  // enforced the check when the secret happened to be set).
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error("[Telegram Webhook] TELEGRAM_WEBHOOK_SECRET not configured — rejecting");
    return NextResponse.json({ ok: false, error: "Not configured" }, { status: 503 });
  }
  if (req.headers.get("x-telegram-bot-api-secret-token") !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const message = body?.message;

    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim().toUpperCase();

    if (text === "/STOP") {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        await supabase
          .from("profiles")
          .update({ telegram_chat_id: null })
          .eq("telegram_chat_id", chatId);
      }
      await sendTelegramReply(chatId, "Disconnected. You will no longer receive Dralvo Telegram alerts.");
      return NextResponse.json({ ok: true });
    }

    if (!text.startsWith("DRALVO-")) {
      await sendTelegramReply(chatId, [
        "Welcome to Dralvo Alerts Bot.",
        "",
        "To connect your account, send your one-time connect code from the Dralvo dashboard.",
        "It looks like: <code>DRALVO-XXXXXXXX</code>",
      ].join("\n"));
      return NextResponse.json({ ok: true });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      console.error("[telegram/webhook] Supabase client unavailable");
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("id, email, notification_prefs")
      .not("notification_prefs", "is", null);

    if (profileErr) {
      console.error("[telegram/webhook] Profile lookup failed:", profileErr);
      await sendTelegramReply(chatId, "Something went wrong. Please try again later.");
      return NextResponse.json({ ok: true });
    }

    const now = Date.now();
    const matchedProfile = profiles?.find((profile) => {
      const prefs = profile.notification_prefs as NotificationPrefs | null;
      const expiresAt = prefs?.telegram_connect_expires_at
        ? Date.parse(prefs.telegram_connect_expires_at)
        : 0;
      return prefs?.telegram_connect_code === text && expiresAt > now;
    });

    if (!matchedProfile) {
      await sendTelegramReply(chatId, "Invalid or expired connect code. Please generate a new code from the Dralvo dashboard.");
      return NextResponse.json({ ok: true });
    }

    const prefs = (matchedProfile.notification_prefs ?? {}) as NotificationPrefs;
    const nextPrefs: NotificationPrefs = {
      ...prefs,
      telegram: true,
    };
    delete nextPrefs.telegram_connect_code;
    delete nextPrefs.telegram_connect_expires_at;

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        telegram_chat_id: chatId,
        notification_prefs: nextPrefs,
      })
      .eq("id", matchedProfile.id);

    if (updateErr) {
      console.error("[telegram/webhook] Update failed:", updateErr);
      await sendTelegramReply(chatId, "Failed to connect. Please try again.");
      return NextResponse.json({ ok: true });
    }

    await sendTelegramReply(chatId, [
      "Connected successfully.",
      "",
      `Your Dralvo account (${matchedProfile.email ?? matchedProfile.id.slice(0, 8)}) is now linked.`,
      "You will receive alert notifications here.",
      "",
      "Use /stop to disconnect at any time.",
    ].join("\n"));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram/webhook] Error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

async function sendTelegramReply(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("[telegram/webhook] Reply failed:", err);
  }
}

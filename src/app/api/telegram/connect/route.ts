import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { isGrantProduct } from "@/lib/admin/license-grant";

type NotificationPrefs = {
  email?: boolean;
  telegram?: boolean;
  in_app?: boolean;
  telegram_connect_code?: string;
  telegram_connect_expires_at?: string;
  /** Which EA the customer clicked "Activate" on — so the bot/owner grants the
   *  right license and names it in the message. */
  telegram_connect_product?: string;
};

const DEFAULT_PREFS = {
  email: true,
  telegram: false,
  in_app: true,
};

function createConnectCode() {
  return `DRALVO-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function GET(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "telegram:connect:get"),
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("telegram_chat_id, notification_prefs")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const prefs = (profile?.notification_prefs ?? DEFAULT_PREFS) as NotificationPrefs;
  const now = Date.now();
  const existingExpires = prefs.telegram_connect_expires_at
    ? Date.parse(prefs.telegram_connect_expires_at)
    : 0;

  const connectCode =
    prefs.telegram_connect_code && existingExpires > now
      ? prefs.telegram_connect_code
      : createConnectCode();

  // Which EA the customer is activating (from the dashboard card). Always take
  // the latest click so the bot grants/names the right EA.
  const productParam = new URL(request.url).searchParams.get("product");
  const product = isGrantProduct(productParam) ? productParam : prefs.telegram_connect_product;

  const nextPrefs = {
    ...DEFAULT_PREFS,
    ...prefs,
    telegram_connect_code: connectCode,
    telegram_connect_expires_at: new Date(now + 10 * 60 * 1000).toISOString(),
    ...(product ? { telegram_connect_product: product } : {}),
  };

  await supabase
    .from("profiles")
    .update({ notification_prefs: nextPrefs })
    .eq("id", user.id);

  return NextResponse.json({
    connectCode,
    expiresAt: nextPrefs.telegram_connect_expires_at,
    isConnected: !!profile?.telegram_chat_id,
    notification_prefs: {
      email: nextPrefs.email !== false,
      telegram: nextPrefs.telegram === true,
      in_app: nextPrefs.in_app !== false,
    },
    botUsername: process.env.TELEGRAM_BOT_USERNAME ?? null,
  });
}

export async function DELETE(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "telegram:connect:delete"),
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ telegram_chat_id: null })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

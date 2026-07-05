/**
 * GET /api/agent/ops/resolve-activation?code=DRALVO-XXXX&chat=<telegram_chat_id>
 *
 * The dashboard "activate TiGold" button deep-links the customer to @dralvo_bot
 * carrying their per-account connect code (t.me/dralvo_bot?start=DRALVO-XXXX).
 * On /start, the bot calls this to resolve the code → the Dralvo account it
 * belongs to, so the license can be bound to that account WITHOUT asking the
 * customer to re-type their email (avoids typos / wrong-account grants).
 *
 * Also links the Telegram chat to the profile so future notifications work.
 *
 * Auth: agent key with scope `ops:grant_key`.
 */
import { NextResponse, type NextRequest } from "next/server";

import { verifyAgentKey } from "@/lib/agent/keys";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const key = await verifyAgentKey(request, "ops:grant_key");
  if (!key) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams;
  const code = (q.get("code") ?? "").trim().toUpperCase();
  const chat = (q.get("chat") ?? "").trim();
  if (!/^DRALVO-[A-F0-9]{8}$/.test(code)) {
    return NextResponse.json({ error: "bad_code" }, { status: 400 });
  }

  const sb = getSupabaseAdminClient();
  if (!sb) return NextResponse.json({ error: "server_config" }, { status: 500 });

  const { data: profile, error } = await sb
    .from("profiles")
    .select("id, notification_prefs, referrer_type, referrer_id")
    .filter("notification_prefs->>telegram_connect_code", "eq", code)
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!profile) return NextResponse.json({ error: "code_not_found" }, { status: 404 });

  const prefs = (profile.notification_prefs ?? {}) as {
    telegram_connect_expires_at?: string;
  } & Record<string, unknown>;
  const exp = prefs.telegram_connect_expires_at ? Date.parse(prefs.telegram_connect_expires_at) : 0;
  if (!exp || exp < Date.now()) {
    return NextResponse.json({ error: "code_expired" }, { status: 410 });
  }

  const { data: u } = await sb.auth.admin.getUserById(profile.id);
  const email = u?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "no_email" }, { status: 404 });

  // Referral attribution — which affiliate/partner link this customer came from.
  // Single-owner source of truth: profiles.referrer_type + referrer_id.
  // Lets the bot tell the owner who to credit when granting the key.
  let referredBy: { type: "affiliate" | "partner"; email: string | null } | null = null;
  const refType = profile.referrer_type as string | null;
  const refId = profile.referrer_id as string | null;
  if (refId && (refType === "affiliate" || refType === "partner")) {
    const { data: ref } = await sb
      .from(refType === "partner" ? "partners" : "affiliates")
      .select("user_id")
      .eq("id", refId)
      .maybeSingle();
    const refUserId = ref?.user_id as string | undefined;
    if (refUserId) {
      const { data: refUser } = await sb.auth.admin.getUserById(refUserId);
      referredBy = { type: refType, email: refUser?.user?.email ?? null };
    }
  }

  // Best-effort: link the Telegram chat to this profile (enables notifications).
  if (/^-?\d+$/.test(chat)) {
    void sb
      .from("profiles")
      .update({ telegram_chat_id: chat, notification_prefs: { ...prefs, telegram: true } })
      .eq("id", profile.id)
      .then(() => undefined, () => undefined);
  }

  return NextResponse.json({ ok: true, user_id: profile.id, email, referredBy });
}

import { NextResponse } from "next/server";

import { evaluateDeviceBinding } from "@/lib/license-devices";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ponytail: EA calls this via WebRequest on startup (and periodically).
// GET /api/license/validate?key=<uuid>&account=<mt5_account>
// `account` is REQUIRED for both tigold and unlimited:
//   - tigold:    must match the single account bound to the key.
//   - unlimited: bound on first use to up to `max_accounts` accounts (anti-share).
export async function GET(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "license:validate"),
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const account = searchParams.get("account")?.trim() || null;

  if (!key) {
    return NextResponse.json({ valid: false, reason: "missing_key" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ valid: false, reason: "server_error" }, { status: 500 });
  }

  const { data } = await supabase
    .from("license_keys")
    .select("id, plan, expires_at, mt5_account, is_lifetime, max_accounts")
    .eq("key", key)
    .single();

  if (!data) {
    return NextResponse.json({ valid: false, reason: "not_found" });
  }

  // Expiry: lifetime comps never expire; every other license needs a concrete
  // future expiry. A null expiry without is_lifetime is rejected so a paid
  // (rental) key can never become valid forever.
  if (data.is_lifetime !== true) {
    if (!data.expires_at || new Date(data.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        reason: data.expires_at ? "expired" : "no_expiry",
      });
    }
  }

  // tigold: locked to the single account bound on the license row.
  if (data.plan === "tigold") {
    if (!account || data.mt5_account !== account) {
      return NextResponse.json({ valid: false, reason: "account_mismatch" });
    }
    return NextResponse.json({ valid: true, plan: data.plan });
  }

  // unlimited: anti-sharing via per-account binding (trust-on-first-use).
  if (!account) {
    return NextResponse.json({ valid: false, reason: "account_required" });
  }

  const { data: devices, error: devicesError } = await supabase
    .from("license_devices")
    .select("mt5_account")
    .eq("license_id", data.id);

  if (devicesError) {
    return NextResponse.json({ valid: false, reason: "server_error" }, { status: 500 });
  }

  const knownAccounts = (devices ?? []).map((d) => d.mt5_account as string);
  const maxAccounts = data.max_accounts ?? 2;
  const decision = evaluateDeviceBinding(knownAccounts, account, maxAccounts);

  if (!decision.allowed) {
    return NextResponse.json({
      valid: false,
      reason: decision.reason ?? "account_limit",
      maxAccounts,
    });
  }

  if (decision.isNew) {
    // Unique (license_id, mt5_account) guards against a concurrent double-insert.
    const { error: insertError } = await supabase
      .from("license_devices")
      .insert({ license_id: data.id, mt5_account: account });
    if (insertError) {
      // Likely a race that registered the same account already — treat as bound.
      const { count } = await supabase
        .from("license_devices")
        .select("id", { count: "exact", head: true })
        .eq("license_id", data.id)
        .eq("mt5_account", account);
      if (!count) {
        return NextResponse.json({ valid: false, reason: "server_error" }, { status: 500 });
      }
    }
  } else {
    await supabase
      .from("license_devices")
      .update({ last_seen: new Date().toISOString() })
      .eq("license_id", data.id)
      .eq("mt5_account", account);
  }

  return NextResponse.json({ valid: true, plan: data.plan, maxAccounts });
}

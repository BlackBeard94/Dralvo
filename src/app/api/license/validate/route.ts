import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

// ponytail: EA calls this via WebRequest on startup.
// GET /api/license/validate?key=<uuid>&account=<mt5_account>
// account is required for tigold plan, optional for unlimited.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const account = searchParams.get("account");

  if (!key) {
    return NextResponse.json({ valid: false, reason: "missing_key" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ valid: false, reason: "server_error" }, { status: 500 });
  }

  const query = supabase
    .from("license_keys")
    .select("plan, expires_at, mt5_account")
    .eq("key", key)
    .single();

  const { data } = await query;

  if (!data) {
    return NextResponse.json({ valid: false, reason: "not_found" });
  }

  // ponytail: tigold requires account match; unlimited is key-only
  if (data.plan === "tigold") {
    if (!account || data.mt5_account !== account) {
      return NextResponse.json({ valid: false, reason: "account_mismatch" });
    }
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  return NextResponse.json({ valid: true, plan: data.plan });
}

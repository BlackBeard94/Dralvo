import { NextResponse } from "next/server";

import { evaluateDeviceBinding } from "@/lib/license-devices";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRODUCTS = new Set(["goldmaster", "goldscalp", "tigold"]);
// An account is considered "live" if the EA validated within this window.
const ACTIVE_WINDOW_MS = 15 * 60 * 1000;

type LicenseRow = {
  id: string;
  mt5_account: string | null;
  max_accounts: number | null;
};

function isValidAccount(value: unknown): value is string {
  return typeof value === "string" && /^\d{4,12}$/.test(value.trim());
}

function parseProduct(value: unknown): string | null {
  return typeof value === "string" && PRODUCTS.has(value) ? value : null;
}

/** Look up the signed-in user's license row for a product (admin client). */
async function getUserLicense(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  userId: string,
  product: string,
): Promise<LicenseRow | null> {
  if (!admin) return null;
  const { data } = await admin
    .from("license_keys")
    .select("id, mt5_account, max_accounts")
    .eq("user_id", userId)
    .eq("product", product)
    .maybeSingle();
  return (data as LicenseRow | null) ?? null;
}

// GET /api/user/license-devices?product=goldmaster
export async function GET(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "user:license-devices:get"),
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const product = parseProduct(new URL(request.url).searchParams.get("product"));
  if (!product) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const license = await getUserLicense(admin, user.id, product);
  if (!license) {
    return NextResponse.json({ hasLicense: false });
  }

  // tigold-free (IB) keys are pre-bound to a single account on the row itself.
  // Only single-account keys (max_accounts <= 1) are hard-locked this way; a
  // multi-account key uses max_accounts + license_devices even if it still
  // carries a legacy mt5_account.
  if (license.mt5_account && (license.max_accounts ?? 2) <= 1) {
    return NextResponse.json({
      hasLicense: true,
      product,
      maxAccounts: 1,
      preBound: license.mt5_account,
      devices: [],
    });
  }

  const { data: rows, error } = await admin
    .from("license_devices")
    .select("mt5_account, first_seen, last_seen")
    .eq("license_id", license.id)
    .order("first_seen", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const devices = (rows ?? []).map((r) => ({
    mt5_account: r.mt5_account as string,
    first_seen: r.first_seen as string,
    last_seen: r.last_seen as string,
    active:
      !!r.last_seen && now - new Date(r.last_seen as string).getTime() < ACTIVE_WINDOW_MS,
  }));

  return NextResponse.json({
    hasLicense: true,
    product,
    maxAccounts: license.max_accounts ?? 2,
    preBound: null,
    devices,
  });
}

// POST /api/user/license-devices  { product, mt5_account }  → bind a new account
export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "user:license-devices:post"),
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    product?: unknown;
    mt5_account?: unknown;
  };
  const product = parseProduct(body.product);
  if (!product) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  if (!isValidAccount(body.mt5_account)) {
    return NextResponse.json({ error: "Số tài khoản MT5 không hợp lệ (4-12 chữ số)." }, { status: 400 });
  }
  const account = body.mt5_account.trim();

  const license = await getUserLicense(admin, user.id, product);
  if (!license) return NextResponse.json({ error: "Không có license cho EA này." }, { status: 404 });
  if (license.mt5_account && (license.max_accounts ?? 2) <= 1) {
    return NextResponse.json(
      { error: "Key này gắn cố định 1 tài khoản (xác minh qua IB), không thể thêm." },
      { status: 409 },
    );
  }

  const { data: rows } = await admin
    .from("license_devices")
    .select("mt5_account")
    .eq("license_id", license.id);
  const known = (rows ?? []).map((r) => r.mt5_account as string);
  const decision = evaluateDeviceBinding(known, account, license.max_accounts ?? 2);
  if (!decision.allowed) {
    return NextResponse.json(
      { error: "Đã đủ số tài khoản cho phép.", maxAccounts: license.max_accounts ?? 2 },
      { status: 409 },
    );
  }
  if (!decision.isNew) {
    return NextResponse.json({ error: "Tài khoản này đã được thêm." }, { status: 409 });
  }

  const { error } = await admin
    .from("license_devices")
    .insert({ license_id: license.id, mt5_account: account });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, mt5_account: account });
}

// PATCH /api/user/license-devices  { product, oldAccount, newAccount }  → rename
export async function PATCH(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "user:license-devices:patch"),
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    product?: unknown;
    oldAccount?: unknown;
    newAccount?: unknown;
  };
  const product = parseProduct(body.product);
  if (!product) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  if (!isValidAccount(body.oldAccount) || !isValidAccount(body.newAccount)) {
    return NextResponse.json({ error: "Số tài khoản MT5 không hợp lệ (4-12 chữ số)." }, { status: 400 });
  }
  const oldAccount = body.oldAccount.trim();
  const newAccount = body.newAccount.trim();

  const license = await getUserLicense(admin, user.id, product);
  if (!license) return NextResponse.json({ error: "Không có license cho EA này." }, { status: 404 });
  if (license.mt5_account && (license.max_accounts ?? 2) <= 1) {
    return NextResponse.json(
      { error: "Key này gắn cố định 1 tài khoản (xác minh qua IB), không thể sửa." },
      { status: 409 },
    );
  }

  const { data: updated, error } = await admin
    .from("license_devices")
    .update({ mt5_account: newAccount, last_seen: new Date().toISOString() })
    .eq("license_id", license.id)
    .eq("mt5_account", oldAccount)
    .select("mt5_account");
  if (error) {
    // Unique (license_id, mt5_account) → the new number already exists.
    return NextResponse.json({ error: "Tài khoản mới đã tồn tại hoặc lỗi cập nhật." }, { status: 409 });
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản cần sửa." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, mt5_account: newAccount });
}

// DELETE /api/user/license-devices  { product, mt5_account }  → free a slot
export async function DELETE(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "user:license-devices:delete"),
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    product?: unknown;
    mt5_account?: unknown;
  };
  const product = parseProduct(body.product);
  if (!product) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  if (!isValidAccount(body.mt5_account)) {
    return NextResponse.json({ error: "Số tài khoản MT5 không hợp lệ." }, { status: 400 });
  }
  const account = body.mt5_account.trim();

  const license = await getUserLicense(admin, user.id, product);
  if (!license) return NextResponse.json({ error: "Không có license cho EA này." }, { status: 404 });
  if (license.mt5_account && (license.max_accounts ?? 2) <= 1) {
    return NextResponse.json(
      { error: "Key này gắn cố định 1 tài khoản (xác minh qua IB), không thể xoá." },
      { status: 409 },
    );
  }

  const { error } = await admin
    .from("license_devices")
    .delete()
    .eq("license_id", license.id)
    .eq("mt5_account", account);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

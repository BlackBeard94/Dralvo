/**
 * GET/POST/DELETE /api/admin/system-notifications
 * Manage user-facing system notifications (shown in the dashboard bell).
 * All admins can read; super_admin can push/delete.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getAdmin } from "@/lib/admin/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  SYSTEM_NOTIFICATION_AUDIENCES,
  SYSTEM_NOTIFICATION_LEVELS,
} from "@/lib/system-notifications";
import { SUPPORTED_LOCALES } from "@/lib/i18n";

/** Keep only known locales with non-empty string values (trimmed, capped). */
function sanitizeI18n(raw: unknown, cap: number): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    const v = (raw as Record<string, unknown>)[loc];
    if (typeof v === "string" && v.trim()) out[loc] = v.trim().slice(0, cap);
  }
  return out;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const { data, error } = await client
    .from("system_notifications")
    .select("id, title, body, level, href, audience, user_id, starts_at, expires_at, created_at, show_in_ticker, title_i18n, body_i18n")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data ?? [] });
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized — super_admin only" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Tiêu đề là bắt buộc." }, { status: 400 });

  const level = SYSTEM_NOTIFICATION_LEVELS.includes(body.level as never)
    ? (body.level as string)
    : "info";
  const audience = SYSTEM_NOTIFICATION_AUDIENCES.includes(body.audience as never)
    ? (body.audience as string)
    : "all";
  const userId = typeof body.user_id === "string" && body.user_id.trim() ? body.user_id.trim() : null;
  if (audience === "user" && !userId) {
    return NextResponse.json({ error: "Cần user_id khi đối tượng là 'user'." }, { status: 400 });
  }

  const { error } = await client.from("system_notifications").insert({
    title,
    body: typeof body.body === "string" && body.body.trim() ? body.body.trim() : null,
    level,
    href: typeof body.href === "string" && body.href.trim() ? body.href.trim() : null,
    audience,
    user_id: audience === "user" ? userId : null,
    expires_at: typeof body.expires_at === "string" && body.expires_at ? body.expires_at : null,
    // Whether it also scrolls in the dashboard ticker (default true).
    show_in_ticker: body.show_in_ticker !== false,
    // Per-locale overrides (title/body above are the fallback).
    title_i18n: sanitizeI18n(body.title_i18n, 200),
    body_i18n: sanitizeI18n(body.body_i18n, 1000),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized — super_admin only" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id là bắt buộc." }, { status: 400 });

  const { error } = await client.from("system_notifications").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

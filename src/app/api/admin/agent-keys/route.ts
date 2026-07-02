/**
 * GET/POST/PATCH/DELETE /api/admin/agent-keys — manage agent API keys.
 *
 * Super-admin only (these keys can read customer data and grant licenses).
 * The plaintext secret is returned exactly once, from POST; afterwards only the
 * prefix + hash exist, so it can never be shown again.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getAdmin } from "@/lib/admin/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { generateAgentKey } from "@/lib/agent/keys";
import { isAgentScope, type AgentScope } from "@/lib/agent/scopes";

const SELECT = "id, label, key_prefix, scopes, active, last_used_at, created_at";

async function guardSuper() {
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") return null;
  return admin;
}

function cleanScopes(input: unknown): AgentScope[] {
  if (!Array.isArray(input)) return [];
  const out = new Set<AgentScope>();
  for (const s of input) if (isAgentScope(s)) out.add(s);
  return [...out];
}

export async function GET() {
  if (!(await guardSuper())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabaseAdminClient();
  if (!sb) return NextResponse.json({ error: "Server config" }, { status: 500 });
  const { data, error } = await sb.from("agent_api_keys").select(SELECT).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data ?? [] });
}

export async function POST(request: NextRequest) {
  const admin = await guardSuper();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabaseAdminClient();
  if (!sb) return NextResponse.json({ error: "Server config" }, { status: 500 });

  let body: { label?: unknown; scopes?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const label = String(body.label ?? "").trim();
  if (!label) return NextResponse.json({ error: "label_required" }, { status: 400 });
  const scopes = cleanScopes(body.scopes);
  if (scopes.length === 0) return NextResponse.json({ error: "scopes_required" }, { status: 400 });

  const { full, prefix, hash } = generateAgentKey();
  const { data, error } = await sb
    .from("agent_api_keys")
    .insert({ label, key_prefix: prefix, key_hash: hash, scopes, created_by: admin.user_id })
    .select(SELECT)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // `key` is included ONLY here — the one and only time it is ever returned.
  return NextResponse.json({ success: true, key: full, record: data });
}

export async function PATCH(request: NextRequest) {
  if (!(await guardSuper())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabaseAdminClient();
  if (!sb) return NextResponse.json({ error: "Server config" }, { status: 500 });

  let body: { id?: unknown; active?: unknown; scopes?: unknown; label?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.active === "boolean") patch.active = body.active;
  if (Array.isArray(body.scopes)) {
    const scopes = cleanScopes(body.scopes);
    if (scopes.length === 0) return NextResponse.json({ error: "scopes_required" }, { status: 400 });
    patch.scopes = scopes;
  }
  if (typeof body.label === "string" && body.label.trim()) patch.label = body.label.trim();

  const { data, error } = await sb.from("agent_api_keys").update(patch).eq("id", id).select(SELECT).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ success: true, record: data });
}

export async function DELETE(request: NextRequest) {
  if (!(await guardSuper())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabaseAdminClient();
  if (!sb) return NextResponse.json({ error: "Server config" }, { status: 500 });

  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  const { error } = await sb.from("agent_api_keys").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

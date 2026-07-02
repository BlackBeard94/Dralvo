import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { AgentScope } from "./scopes";

/**
 * DB-backed agent API keys. The plaintext secret is `drv_<40 hex>`; we store only
 * its SHA-256 hash + a display prefix. Verification hashes the presented token
 * and looks it up among active keys, then checks the required scope.
 */

const PREFIX = "drv_";

export type NewAgentKey = { full: string; prefix: string; hash: string };

/** Generate a fresh secret. Return the full token (shown once) + its hash. */
export function generateAgentKey(): NewAgentKey {
  const full = PREFIX + randomBytes(20).toString("hex"); // drv_ + 40 hex chars
  const hash = sha256(full);
  return { full, prefix: full.slice(0, PREFIX.length + 8), hash };
}

export function sha256(v: string): string {
  return createHash("sha256").update(v).digest("hex");
}

function extractToken(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return (request.headers.get("x-api-key") ?? "").trim();
}

export type AgentKeyRecord = { id: string; label: string; scopes: string[] };

/**
 * Verify the request's bearer token against the DB and require `scope`.
 * Returns the key record on success, or null (unauthorized / missing scope).
 * Best-effort stamps last_used_at; never throws.
 */
export async function verifyAgentKey(
  request: Request,
  scope: AgentScope,
): Promise<AgentKeyRecord | null> {
  const token = extractToken(request);
  if (!token) return null;

  const sb = getSupabaseAdminClient();
  if (!sb) return null;

  const hash = sha256(token);
  const { data, error } = await sb
    .from("agent_api_keys")
    .select("id, label, scopes, active")
    .eq("key_hash", hash)
    .maybeSingle();

  if (error || !data || data.active !== true) return null;

  const scopes = Array.isArray(data.scopes) ? (data.scopes as string[]) : [];
  if (!scopes.includes(scope)) return null;

  // Fire-and-forget last-used stamp — don't block or fail the request on it.
  void sb
    .from("agent_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => undefined, () => undefined);

  return { id: String(data.id), label: String(data.label), scopes };
}

/**
 * Blog auth with backward compatibility: accepts either a DB key carrying the
 * `blog:write` scope, or the legacy BLOG_AGENT_API_KEY env secret. Lets existing
 * blog-agent integrations keep working while new keys go through the DB.
 */
export async function verifyBlogAgent(request: Request): Promise<boolean> {
  if (await verifyAgentKey(request, "blog:write")) return true;

  const legacy = process.env.BLOG_AGENT_API_KEY;
  if (!legacy) return false;
  const token = extractToken(request);
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(legacy);
  return a.length === b.length && timingSafeEqual(a, b);
}

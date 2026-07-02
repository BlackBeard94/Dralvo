/**
 * POST /api/agent/ops/grant-key — grant a free license to a user by email.
 * Auth: agent key with scope `ops:grant_key` (Bearer / x-api-key).
 *
 * Body: { email, plan?, product?, allProducts?, maxAccounts? }
 *   plan       "tigold" | "unlimited"   (default "tigold")
 *   product    one EA, or set allProducts:true for the full VIP bundle
 * Idempotent upsert on (user_id, product). Every grant is audit-logged.
 */
import { NextResponse, type NextRequest } from "next/server";

import { verifyAgentKey } from "@/lib/agent/keys";
import { grantLicense, type GrantPlan, type GrantProduct } from "@/lib/admin/license-grant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const key = await verifyAgentKey(request, "ops:grant_key");
  if (!key) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    email?: unknown;
    plan?: unknown;
    product?: unknown;
    allProducts?: unknown;
    maxAccounts?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  const plan = (typeof body.plan === "string" ? body.plan : "tigold") as GrantPlan;
  const product = typeof body.product === "string" ? (body.product as GrantProduct) : undefined;
  const allProducts = body.allProducts === true;
  const maxAccounts = typeof body.maxAccounts === "number" ? body.maxAccounts : undefined;

  const result = await grantLicense({ email, plan, product, allProducts, maxAccounts });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Audit trail — agents have no auth.users id, so log to the server (the key's
  // last_used_at is also stamped by verifyAgentKey).
  console.warn(
    `[AUDIT agent-grant-key] key="${key.label}" (${key.id}) granted plan=${plan} ` +
      `products=[${result.products.join(",")}] to email=${email} at ${new Date().toISOString()}`,
  );

  return NextResponse.json({ success: true, email, plan, products: result.products });
}

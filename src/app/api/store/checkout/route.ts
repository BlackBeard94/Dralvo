/**
 * POST /api/store/checkout — guest checkout for a vault EA.
 * Body: { eaId: string, email: string }
 *
 * Creates a pending order, opens a Cryptomus invoice and returns its URL. The
 * buyer needs no Dralvo account: entitlement is delivered by e-mail once
 * /api/cryptomus/webhook confirms the payment.
 */
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { createInvoice, isCryptomusConfigured } from "@/lib/cryptomus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function siteUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && configured !== "http://localhost:3000") return configured.replace(/\/$/, "");
  return request.nextUrl.origin.replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  const limit = checkRateLimit({ key: rateLimitKey(request, "store:checkout"), limit: 10, windowMs: 60_000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  if (!isCryptomusConfigured()) {
    return NextResponse.json({ error: "payment_unavailable" }, { status: 503 });
  }

  let body: { eaId?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const eaId = String(body.eaId ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!eaId) return NextResponse.json({ error: "missing_ea" }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "invalid_email" }, { status: 400 });

  const sb = getSupabaseAdminClient();
  if (!sb) return NextResponse.json({ error: "server_config" }, { status: 500 });

  // Price comes from the DB, never from the client.
  const { data: ea } = await sb
    .from("vault_eas")
    .select("id, name, price_usd, enabled, for_sale")
    .eq("id", eaId)
    .maybeSingle();
  if (!ea || !ea.enabled || !ea.for_sale) {
    return NextResponse.json({ error: "ea_unavailable" }, { status: 404 });
  }

  const amount = Number(ea.price_usd);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "invalid_price" }, { status: 500 });
  }

  const providerOrderId = `dv_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const { data: order, error: insErr } = await sb
    .from("vault_orders")
    .insert({
      ea_id: ea.id,
      email,
      amount_usd: amount,
      provider_order_id: providerOrderId,
      status: "pending",
    })
    .select("id")
    .single();
  if (insErr || !order) {
    console.error("[store/checkout] insert failed:", insErr?.message);
    return NextResponse.json({ error: "order_failed" }, { status: 500 });
  }

  const base = siteUrl(request);
  const invoice = await createInvoice({
    amountUsd: amount,
    orderId: providerOrderId,
    callbackUrl: `${base}/api/cryptomus/webhook`,
    successUrl: `${base}/kho/thanh-cong`,
    returnUrl: `${base}/kho`,
  });

  if (!invoice.ok) {
    await sb.from("vault_orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    return NextResponse.json({ error: invoice.error }, { status: 502 });
  }

  await sb
    .from("vault_orders")
    .update({ provider_uuid: invoice.uuid, updated_at: new Date().toISOString() })
    .eq("id", order.id);

  console.warn(`[store/checkout] order=${providerOrderId} ea="${ea.name}" email=${email} amount=$${amount}`);
  return NextResponse.json({ url: invoice.paymentUrl });
}

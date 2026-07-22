import "server-only";
import { createHash } from "node:crypto";

/**
 * Cryptomus (crypto payment gateway) — minimal client for one-off invoices.
 *
 * Auth model: every request carries `merchant` (merchant UUID) and `sign`,
 * where sign = md5( base64(json_body) + PAYMENT_API_KEY ). Webhooks are signed
 * the same way, with the `sign` field removed from the body before hashing.
 *
 * Env (both required; the store degrades to "unavailable" without them):
 *   CRYPTOMUS_MERCHANT_ID  — Merchant UUID  (Cryptomus → Settings → API)
 *   CRYPTOMUS_PAYMENT_KEY  — Payment API key
 */
const API_BASE = "https://api.cryptomus.com/v1";

function creds(): { merchant: string; key: string } | null {
  const merchant = process.env.CRYPTOMUS_MERCHANT_ID;
  const key = process.env.CRYPTOMUS_PAYMENT_KEY;
  return merchant && key ? { merchant, key } : null;
}

export function isCryptomusConfigured(): boolean {
  return creds() !== null;
}

function signPayload(jsonBody: string, key: string): string {
  return createHash("md5")
    .update(Buffer.from(jsonBody, "utf8").toString("base64") + key)
    .digest("hex");
}

export type CreateInvoiceInput = {
  amountUsd: number;
  /** Our own order id — Cryptomus echoes it back on the webhook. */
  orderId: string;
  /** Where Cryptomus POSTs the payment result. */
  callbackUrl: string;
  /** Where the buyer lands after paying / cancelling. */
  successUrl: string;
  returnUrl: string;
};

export type CreateInvoiceResult =
  | { ok: true; paymentUrl: string; uuid: string }
  | { ok: false; error: string };

export async function createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult> {
  const c = creds();
  if (!c) return { ok: false, error: "cryptomus_not_configured" };

  const body = {
    amount: input.amountUsd.toFixed(2),
    currency: "USD",
    order_id: input.orderId,
    url_callback: input.callbackUrl,
    url_success: input.successUrl,
    url_return: input.returnUrl,
    // Buyer picks the coin/network on the Cryptomus checkout page.
    lifetime: 3600,
  };
  const json = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}/payment`, {
      method: "POST",
      headers: {
        merchant: c.merchant,
        sign: signPayload(json, c.key),
        "Content-Type": "application/json",
      },
      body: json,
    });
    const data = (await res.json()) as {
      state?: number;
      result?: { uuid?: string; url?: string };
      message?: string;
      errors?: unknown;
    };

    if (!res.ok || data.state !== 0 || !data.result?.url || !data.result?.uuid) {
      const detail = data.message || JSON.stringify(data.errors ?? {}) || `HTTP ${res.status}`;
      console.error("[cryptomus] create invoice failed:", detail);
      return { ok: false, error: "invoice_failed" };
    }
    return { ok: true, paymentUrl: data.result.url, uuid: data.result.uuid };
  } catch (err) {
    console.error("[cryptomus] create invoice error:", (err as Error).message);
    return { ok: false, error: "network_error" };
  }
}

/**
 * Verify a webhook body. Cryptomus signs the JSON with the `sign` key removed,
 * so we strip it, re-serialise and compare. Returns false when unconfigured so
 * an unsigned request can never be treated as a paid order.
 */
export function verifyWebhookSignature(body: Record<string, unknown>): boolean {
  const c = creds();
  if (!c) return false;
  const received = typeof body.sign === "string" ? body.sign : "";
  if (!received) return false;

  const rest: Record<string, unknown> = { ...body };
  delete rest.sign;
  const expected = signPayload(JSON.stringify(rest), c.key);
  // Both are hex md5 of equal length — plain compare is fine here (no secret
  // is revealed by timing on a hash comparison of attacker-supplied data).
  return expected === received;
}

/** Cryptomus payment_status values that mean "money received". */
export const PAID_STATUSES = new Set(["paid", "paid_over"]);

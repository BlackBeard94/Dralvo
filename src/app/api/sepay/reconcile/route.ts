import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/api-auth";
import {
  fetchSepayRecentTransactions,
  parseSepayWebhookPayload,
} from "@/lib/sepay";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { recordRunLog } from "@/lib/run-logs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

type PendingPayment = {
  reference: string;
  amount_vnd: number;
};

export async function GET(request: Request) {
  const startedAt = new Date().toISOString();
  const start = Date.now();
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "sepay:reconcile"),
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured" },
      { status: 503 },
    );
  }

  try {
    const { data: pendingRows, error: pendingError } = await supabase
      .from("vietqr_payment_requests")
      .select("reference,amount_vnd")
      .eq("status", "pending")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    if (pendingError) {
      throw new Error(pendingError.message);
    }

    const pending = (pendingRows ?? []) as PendingPayment[];
    const pendingByReference = new Map(
      pending.map((payment) => [payment.reference.toUpperCase(), payment]),
    );

    if (pendingByReference.size === 0) {
      await recordRunLog({
        runType: "sepay_reconcile",
        status: "success",
        startedAt,
        durationMs: Date.now() - start,
        metadata: { pending: 0, matched: 0, confirmed: 0 },
      });

      return NextResponse.json(
        { ok: true, pending: 0, matched: 0, confirmed: 0, results: [] },
        { headers: NO_STORE_HEADERS },
      );
    }

    const transactions = await fetchSepayRecentTransactions();
    const results: Array<{ reference: string; status: string }> = [];

    for (const transaction of transactions) {
      const parsed = parseSepayWebhookPayload(transaction);
      if (!parsed.ok) continue;

      if (!pendingByReference.has(parsed.payment.reference)) continue;

      const { payload, reference, transactionAt } = parsed.payment;
      const { data, error } = await supabase.rpc(
        "confirm_sepay_vietqr_payment",
        {
          p_reference: reference,
          p_amount_vnd: payload.transferAmount,
          p_provider_transaction_id: payload.id,
          p_provider_reference_code: payload.referenceCode ?? "",
          p_provider_transaction_at: transactionAt,
          p_provider_payload: {
            ...payload,
            reconciliation: "sepay_api_v2",
          },
        },
      );

      if (error) {
        results.push({ reference, status: "rpc_error" });
        continue;
      }

      const result = Array.isArray(data) ? data[0] : data;
      results.push({ reference, status: result?.result ?? "unknown" });
    }

    const confirmed = results.filter(
      (result) => result.status === "confirmed",
    ).length;

    await recordRunLog({
      runType: "sepay_reconcile",
      status: results.some((result) => result.status === "rpc_error")
        ? "error"
        : "success",
      startedAt,
      durationMs: Date.now() - start,
      metadata: {
        pending: pendingByReference.size,
        fetched: transactions.length,
        matched: results.length,
        confirmed,
        results,
      },
      error: results.some((result) => result.status === "rpc_error")
        ? "One or more SePay reconciliation RPC calls failed."
        : null,
    });

    return NextResponse.json(
      {
        ok: true,
        pending: pendingByReference.size,
        fetched: transactions.length,
        matched: results.length,
        confirmed,
        results,
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await recordRunLog({
      runType: "sepay_reconcile",
      status: "error",
      startedAt,
      durationMs: Date.now() - start,
      error: message,
    });

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type RunLogStatus = "success" | "error";
export type RunLogType =
  | "alerts_evaluate"
  | "indicator_ingest"
  | "cftc_gold_backfill"
  | "gld_holdings_backfill"
  | "tips_yield_backfill"
  | "xauusd_price_backfill"
  | "gold_thesis_generate"
  | "source_health_alert"
  | "stripe_webhook"
  | "sepay_reconcile";

type RunLogInput = {
  runType: RunLogType;
  status: RunLogStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  error?: string | null;
};

export async function recordRunLog(input: RunLogInput) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const finishedAt = input.finishedAt ?? new Date().toISOString();

  try {
    const { error } = await supabase.from("run_logs").insert({
      run_type: input.runType,
      status: input.status,
      started_at: input.startedAt,
      finished_at: finishedAt,
      duration_ms: input.durationMs ?? null,
      metadata: input.metadata ?? {},
      error: input.error ?? null,
    });

    if (error) {
      console.error("[run_logs] Failed to record run log:", error.message);
    }
  } catch (err) {
    console.error("[run_logs] Failed to record run log:", err);
  }
}

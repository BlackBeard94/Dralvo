"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

type RunLog = {
  id: string;
  run_type: string;
  status: "success" | "error";
  started_at: string;
  finished_at: string;
  duration_ms: number | null;
  error: string | null;
};

type RunLogsResponse = {
  logs?: RunLog[];
  error?: string;
};

function formatRunType(value: string) {
  return value.replace(/_/g, " ");
}

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RunLogsPanel() {
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ops/run-logs", {
        cache: "no-store",
      });
      const body = (await response.json()) as RunLogsResponse;
      if (!response.ok) {
        setError(body.error ?? "Run logs unavailable");
        setLogs([]);
        return;
      }
      setLogs(body.logs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run logs unavailable");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gold" />
          <h2 className="font-display text-lg text-text-primary">
            Operational run logs
          </h2>
        </div>
        <button
          type="button"
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] font-semibold text-text-secondary hover:border-border-gold hover:text-gold disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" />
            Logs hidden
          </div>
          Set <code>ADMIN_EMAILS</code> on Vercel to your account email to view
          internal run logs. Current response: {error}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-text-muted">
          No run logs yet. They will appear after ingest, alert evaluation, or Stripe webhook events.
        </p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card/70 p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {log.status === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-red" />
                  )}
                  <span className="font-mono text-xs uppercase tracking-[0.08em] text-text-primary">
                    {formatRunType(log.run_type)}
                  </span>
                </div>
                {log.error && (
                  <p className="mt-1 line-clamp-2 text-xs text-red">
                    {log.error}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right font-mono text-[13px] text-text-muted">
                <div>{formatTime(log.finished_at)}</div>
                <div>{log.duration_ms ?? 0}ms</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

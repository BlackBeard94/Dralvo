/**
 * useIndicatorStream — Phase 2 real data hook
 *
 * Polls /api/indicators every 30s for the latest indicator snapshots.
 * Keeps the last verified snapshots if the API is temporarily unreachable.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  IndicatorHistoryPoint,
  IndicatorSnapshot,
} from "@/data/indicators";
const POLL_INTERVAL_MS = 30_000; // 30 seconds

export interface IndicatorStreamState {
  /** Current verified snapshot for each available indicator. */
  snapshots: IndicatorSnapshot[];
  /** Set of indicator keys that updated in the last tick. */
  justUpdated: Set<string>;
  /** Chronological real snapshot history, keyed by indicator key. */
  historyByKey: Record<string, IndicatorHistoryPoint[]>;
  /** Manually trigger a refresh. */
  tickNow: (key: string) => void;
  /** Clear the local snapshot state. */
  reset: () => void;
}

export function useIndicatorStream(): IndicatorStreamState {
  const [snapshots, setSnapshots] = useState<IndicatorSnapshot[]>([]);
  const [justUpdated, setJustUpdated] = useState<Set<string>>(new Set());
  const [historyByKey, setHistoryByKey] = useState<
    Record<string, IndicatorHistoryPoint[]>
  >({});
  const abortRef = useRef<AbortController | null>(null);

  const fetchSnapshots = useCallback(async () => {
    try {
      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      const res = await fetch("/api/indicators", {
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) return;

      const json = await res.json();
      const fresh: IndicatorSnapshot[] = json.snapshots ?? [];
      const freshHistory: Record<string, IndicatorHistoryPoint[]> =
        json.history ?? {};

      if (fresh.length === 0) return;

      setSnapshots((prev) => {
        const updated = new Set<string>();

        for (const s of fresh) {
          const old = prev.find((p) => p.key === s.key);
          if (!old || old.value !== s.value || old.status !== s.status) {
            updated.add(s.key);
          }
        }

        if (updated.size > 0) {
          setJustUpdated(updated);
          setTimeout(() => setJustUpdated(new Set()), 1500);
        }

        return fresh;
      });
      setHistoryByKey(freshHistory);
    } catch {
      // Keep the last verified snapshots during a transient error.
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchSnapshots();
    }, 0);

    const interval = setInterval(fetchSnapshots, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [fetchSnapshots]);

  const tickNow = useCallback(
    (_key: string) => {
      fetchSnapshots();
    },
    [fetchSnapshots],
  );

  const reset = useCallback(() => {
    setSnapshots([]);
    setJustUpdated(new Set());
    setHistoryByKey({});
  }, []);

  return { snapshots, justUpdated, historyByKey, tickNow, reset };
}

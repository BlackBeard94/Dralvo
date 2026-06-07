/**
 * useIndicatorStream — Phase 2 real data hook
 *
 * Polls /api/indicators every 30s for the latest indicator snapshots.
 * Falls back to mock data if the API is unreachable.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { IndicatorSnapshot } from "@/data/indicators";
import { indicatorSnapshots as fallbackSnapshots } from "@/data/indicators";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export interface IndicatorStreamState {
  /** Current snapshot for each indicator (always 6 entries). */
  snapshots: IndicatorSnapshot[];
  /** Set of indicator keys that updated in the last tick. */
  justUpdated: Set<string>;
  /** Manually trigger a refresh. */
  tickNow: (key: string) => void;
  /** Reset to fallback mock data. */
  reset: () => void;
}

export function useIndicatorStream(): IndicatorStreamState {
  const [snapshots, setSnapshots] = useState<IndicatorSnapshot[]>(fallbackSnapshots);
  const [justUpdated, setJustUpdated] = useState<Set<string>>(new Set());
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
    } catch {
      // Silently ignore — keep current snapshots
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
    setSnapshots(fallbackSnapshots);
    setJustUpdated(new Set());
  }, []);

  return { snapshots, justUpdated, tickNow, reset };
}

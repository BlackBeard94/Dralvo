"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { XAUUSD_SPOT, dashboardCandles, type CandleOHLC } from "@/data/indicators";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface XauusdResponse {
  ok: boolean;
  source: string;
  spot: number;
  candles: CandleOHLC[];
}

type Session = "asia" | "london" | "new-york";

interface SessionInfo {
  key: Session;
  label: string;
  tz: string;
  gmtStart: number;
  gmtEnd: number;
}

interface DayStats {
  high: number;
  low: number;
  week52High: number;
  week52Low: number;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const POLL_INTERVAL_MS = 30_000;

const SESSIONS: SessionInfo[] = [
  { key: "asia", label: "Asia", tz: "Asia/Tokyo", gmtStart: 0, gmtEnd: 9 },
  { key: "london", label: "London", tz: "Europe/London", gmtStart: 8, gmtEnd: 17 },
  { key: "new-york", label: "New York", tz: "America/New_York", gmtStart: 13, gmtEnd: 22 },
];

const SESSION_BAR_SEGMENTS = [
  { key: "asia" as const, label: "Asia", start: 0, end: 9 },
  { key: "london" as const, label: "London", start: 8, end: 17 },
  { key: "new-york" as const, label: "NY", start: 13, end: 22 },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Get the current GMT hour (0-23) */
function getGMTHour(): number {
  return new Date().getUTCHours();
}

/** Determine which session(s) are active right now */
function getActiveSessions(hour: number): {
  primary: Session | null;
  isOverlap: boolean;
  overlapLabel: string | null;
} {
  const active = SESSIONS.filter((s) => hour >= s.gmtStart && hour < s.gmtEnd);

  if (active.length === 0) {
    return { primary: null, isOverlap: false, overlapLabel: null };
  }

  // Check for London/NY overlap (13:00-17:00 GMT)
  const hasLondon = active.some((s) => s.key === "london");
  const hasNY = active.some((s) => s.key === "new-york");

  if (hasLondon && hasNY) {
    return { primary: "london", isOverlap: true, overlapLabel: "LON ↔ NY" };
  }

  return {
    primary: active[0].key,
    isOverlap: false,
    overlapLabel: null,
  };
}

/** Format a number as USD price with commas and 2 decimals */
function formatPrice(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format a number as a compact price string */
function formatCompact(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Format time in a session's timezone */
function formatSessionTime(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
  } catch {
    return "--:--";
  }
}

/** Compute day and 52-week stats from candle data */
function computeStats(candles: CandleOHLC[]): DayStats {
  if (candles.length === 0) {
    return { high: 0, low: 0, week52High: 0, week52Low: 0 };
  }

  let dayHigh = -Infinity;
  let dayLow = Infinity;

  for (const c of candles) {
    if (c.high > dayHigh) dayHigh = c.high;
    if (c.low < dayLow) dayLow = c.low;
  }

  const mid = (dayHigh + dayLow) / 2;
  const range = dayHigh - dayLow;

  return {
    high: dayHigh,
    low: dayLow,
    week52High: Math.round((mid + range * 1.3) * 100) / 100,
    week52Low: Math.round((mid - range * 0.7) * 100) / 100,
  };
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

/** The pulsing green dot indicating live data */
function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--green)] opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--green)]" />
    </span>
  );
}

/** Session timeline bar showing all 3 sessions */
function SessionBar({ activeHour }: { activeHour: number }) {
  return (
    <div className="flex items-center gap-0.5 w-full max-w-[200px]">
      {SESSION_BAR_SEGMENTS.map((seg) => {
        const isActive = activeHour >= seg.start && activeHour < seg.end;
        const width = `${((seg.end - seg.start) / 24) * 100}%`;

        return (
          <div
            key={seg.key}
            className="relative group"
            style={{ width, minWidth: 0 }}
          >
            <div
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                isActive
                  ? "bg-[var(--gold-bright)] shadow-[0_0_6px_var(--gold-glow)]"
                  : "bg-[var(--bg-border)]",
              )}
            />
            {/* Tooltip */}
            <div
              className={cn(
                "absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px]",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                "bg-[var(--bg-card)] border border-[var(--bg-border)] text-[var(--text-secondary)]",
                "whitespace-nowrap pointer-events-none",
              )}
            >
              {seg.label} ({seg.start.toString().padStart(2, "0")}:00-{seg.end.toString().padStart(2, "0")}:00 GMT)
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** A single stat pair (label + value) */
function StatPair({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-[10px] font-medium tracking-wider uppercase text-[var(--text-muted)]">
        {label}
      </span>
      <span className="text-xs font-mono tabular-nums text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

export function MarketHeader() {
  /* ---- state ---- */
  const [spot, setSpot] = useState<number>(XAUUSD_SPOT);
  const [prevSpot, setPrevSpot] = useState<number>(XAUUSD_SPOT);
  const [candles, setCandles] = useState<CandleOHLC[]>(dashboardCandles);
  const [dataSource, setDataSource] = useState<string>("fallback");
  const [error, setError] = useState<string | null>(null);
  const [gmtHour, setGmtHour] = useState<number>(getGMTHour());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- polling ---- */
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/xauusd");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: XauusdResponse = await res.json();

      setSpot((prev) => {
        if (json.spot !== prev) {
          setPrevSpot(prev);
        }
        return json.spot;
      });
      setCandles(json.candles);
      setDataSource(json.source);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
      // Keep current spot on error — graceful degradation
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchData();
    }, 0);

    intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
    clockRef.current = setInterval(() => setGmtHour(getGMTHour()), 60_000);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, [fetchData]);

  /* ---- derived values ---- */
  const change = useMemo(() => spot - prevSpot, [spot, prevSpot]);
  const changePercent = useMemo(
    () => (prevSpot !== 0 ? (change / prevSpot) * 100 : 0),
    [change, prevSpot],
  );

  const bid = useMemo(() => spot - 0.5, [spot]);
  const ask = useMemo(() => spot + 0.5, [spot]);
  const spread = useMemo(() => ask - bid, [ask, bid]);

  const session = useMemo(() => getActiveSessions(gmtHour), [gmtHour]);

  const activeSessionInfo = useMemo(
    () => SESSIONS.find((s) => s.key === session.primary),
    [session.primary],
  );

  const sessionTime = useMemo(
    () =>
      activeSessionInfo ? formatSessionTime(activeSessionInfo.tz) : "--:--",
    [activeSessionInfo],
  );

  const stats = useMemo(() => computeStats(candles), [candles]);

  const isPositive = change > 0;
  const isFlat = change === 0;
  const ChangeIcon = isFlat ? Minus : isPositive ? TrendingUp : TrendingDown;

  /* ---- render ---- */
  return (
    <div
      className={cn(
        "w-full bg-[var(--bg-surface)] border-b border-[var(--bg-border)]",
        "px-4 md:px-6",
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-6 gap-y-2",
          "min-h-[72px] py-2",
          "max-w-full",
        )}
      >
        {/* ── 1. XAUUSD Ticker ── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <LiveDot />
              <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-[var(--text-muted)]">
                XAUUSD
              </span>
            </div>
            <span
              className="text-2xl md:text-[28px] leading-none font-['DM_Serif_Display',serif] text-[var(--text-primary)] tabular-nums"
              style={{ fontFamily: "DM Serif Display, serif" }}
            >
              ${formatPrice(spot)}
            </span>
          </div>

          {/* Change badge */}
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono tabular-nums",
              isFlat
                ? "bg-[var(--bg-border)] text-[var(--text-muted)]"
                : isPositive
                  ? "bg-[var(--green)]/10 text-[var(--green)]"
                  : "bg-[var(--red)]/10 text-[var(--red)]",
            )}
          >
            <ChangeIcon size={12} strokeWidth={2.5} />
            <span>
              {isFlat ? "" : isPositive ? "+" : "-"}$
              {formatPrice(Math.abs(change))}
            </span>
            <span className="opacity-70">
              ({isFlat ? "0.00" : `${isPositive ? "+" : ""}${changePercent.toFixed(2)}`}%)
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-10 bg-[var(--bg-border)] shrink-0" />

        {/* ── 2. Bid/Ask Spread ── */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium tracking-wider uppercase text-[var(--text-muted)]">
              Bid
            </span>
            <span className="text-sm font-mono tabular-nums text-[var(--text-primary)]">
              ${formatPrice(bid)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium tracking-wider uppercase text-[var(--text-muted)]">
              Spread
            </span>
            <span className="text-xs font-mono tabular-nums text-[var(--text-secondary)]">
              ${spread.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium tracking-wider uppercase text-[var(--text-muted)]">
              Ask
            </span>
            <span className="text-sm font-mono tabular-nums text-[var(--text-primary)]">
              ${formatPrice(ask)}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-10 bg-[var(--bg-border)] shrink-0" />

        {/* ── 3. Session Indicator ── */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {session.isOverlap ? (
                <span className="text-xs font-semibold tracking-wider uppercase text-[var(--gold-bright)]">
                  {session.overlapLabel}
                </span>
              ) : session.primary ? (
                <span className="text-xs font-semibold tracking-wider uppercase text-[var(--text-primary)]">
                  {activeSessionInfo?.label}
                </span>
              ) : (
                <span className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)]">
                  Closed
                </span>
              )}
              {session.primary && (
                <span className="text-[10px] font-mono tabular-nums text-[var(--text-muted)]">
                  {sessionTime}{" "}
                  {activeSessionInfo?.tz
                    ? (() => {
                        try {
                          const parts = new Intl.DateTimeFormat("en-US", {
                            timeZone: activeSessionInfo.tz,
                            timeZoneName: "short",
                          }).formatToParts(new Date());
                          const tzPart = parts.find(
                            (p) => p.type === "timeZoneName",
                          );
                          return tzPart?.value ?? "";
                        } catch {
                          return "";
                        }
                      })()
                    : ""}
                </span>
              )}
            </div>
            <SessionBar activeHour={gmtHour} />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-0 hidden md:block" />

        {/* Divider */}
        <div className="hidden md:block w-px h-10 bg-[var(--bg-border)] shrink-0" />

        {/* ── 4. Quick Stats ── */}
        <div className="hidden md:flex items-center gap-5 shrink-0">
          <StatPair label="Day High" value={`$${formatPrice(stats.high)}`} />
          <StatPair label="Day Low" value={`$${formatPrice(stats.low)}`} />
          <div className="hidden xl:block w-px h-8 bg-[var(--bg-border)]" />
          <div className="hidden xl:flex items-center gap-5">
            <StatPair
              label="52W High"
              value={`$${formatCompact(stats.week52High)}`}
            />
            <StatPair
              label="52W Low"
              value={`$${formatCompact(stats.week52Low)}`}
            />
          </div>
        </div>

        {/* ── Mobile: condensed stats ── */}
        <div className="flex md:hidden items-center gap-4 w-full">
          <StatPair label="H" value={`$${formatCompact(stats.high)}`} />
          <StatPair label="L" value={`$${formatCompact(stats.low)}`} />
          <div className="flex-1" />
          <span className="text-[10px] font-medium tracking-wider uppercase text-[var(--text-muted)]">
            {session.isOverlap
              ? session.overlapLabel
              : session.primary
                ? activeSessionInfo?.label
                : "Closed"}
          </span>
        </div>

        {/* ── Data source indicator ── */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              "relative flex h-1.5 w-1.5",
              error && "animate-pulse",
            )}
          >
            <span
              className={cn(
                "relative inline-flex rounded-full h-1.5 w-1.5",
                error
                  ? "bg-[var(--red)]"
                  : dataSource === "twelve-data"
                    ? "bg-[var(--green)]"
                    : "bg-[var(--gold-pale)]",
              )}
            />
          </span>
          <span className="text-[10px] font-medium tracking-wider uppercase text-[var(--text-muted)]">
            {error
              ? "Offline"
              : dataSource === "twelve-data"
                ? "Live"
                : "Cached"}
          </span>
        </div>
      </div>
    </div>
  );
}

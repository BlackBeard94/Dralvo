"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

const ORDER = ["XAU", "SGE", "COT", "COMEX", "ETF", "TIPS", "BTC"] as const;
type Key = (typeof ORDER)[number];

const LABELS: Record<Key, string> = {
  XAU: "XAUUSD",
  SGE: "SGE Premium",
  COT: "COT Swap",
  COMEX: "COMEX Inv",
  ETF: "ETF Flows",
  TIPS: "TIPS Yield",
  BTC: "Gold-BTC",
};

const SHORT_LABELS: Record<Key, string> = {
  XAU: "XAU",
  SGE: "SGE",
  COT: "COT",
  COMEX: "CMX",
  ETF: "ETF",
  TIPS: "TIPS",
  BTC: "BTC",
};

const CORRELATION_DATA: Record<Key, Record<Key, number>> = {
  XAU: { XAU: 1.0, SGE: 0.72, COT: 0.65, COMEX: -0.58, ETF: 0.81, TIPS: -0.74, BTC: -0.35 },
  SGE: { XAU: 0.72, SGE: 1.0, COT: 0.45, COMEX: -0.3, ETF: 0.55, TIPS: -0.4, BTC: -0.2 },
  COT: { XAU: 0.65, SGE: 0.45, COT: 1.0, COMEX: -0.35, ETF: 0.5, TIPS: -0.42, BTC: -0.15 },
  COMEX: { XAU: -0.58, SGE: -0.3, COT: -0.35, COMEX: 1.0, ETF: -0.48, TIPS: 0.3, BTC: 0.1 },
  ETF: { XAU: 0.81, SGE: 0.55, COT: 0.5, COMEX: -0.48, ETF: 1.0, TIPS: -0.68, BTC: -0.25 },
  TIPS: { XAU: -0.74, SGE: -0.4, COT: -0.42, COMEX: 0.3, ETF: -0.68, TIPS: 1.0, BTC: 0.22 },
  BTC: { XAU: -0.35, SGE: -0.2, COT: -0.15, COMEX: 0.1, ETF: -0.25, TIPS: 0.22, BTC: 1.0 },
};

/* ------------------------------------------------------------------ */
/*  Color helpers                                                     */
/* ------------------------------------------------------------------ */

function correlationColor(value: number): string {
  const abs = Math.abs(value);
  if (value > 0) {
    return `rgba(34, 197, 94, ${(0.15 + abs * 0.7).toFixed(2)})`;
  } else if (value < 0) {
    return `rgba(239, 68, 68, ${(0.15 + abs * 0.7).toFixed(2)})`;
  }
  return "rgba(100, 100, 100, 0.2)";
}

function correlationTextColor(value: number): string {
  const abs = Math.abs(value);
  if (abs < 0.3) return "var(--text-muted)";
  if (value > 0) return "var(--green)";
  return "var(--red)";
}

function correlationStrength(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 0.7) return "Strong";
  if (abs >= 0.3) return "Moderate";
  return "Weak";
}

function correlationDirection(value: number): string {
  if (value > 0.05) return "Positive";
  if (value < -0.05) return "Negative";
  return "Neutral";
}

/* ------------------------------------------------------------------ */
/*  Insights                                                          */
/* ------------------------------------------------------------------ */

interface Insight {
  a: Key;
  b: Key;
  value: number;
  interpretation: string;
}

const INSIGHT_INTERPRETATIONS: Partial<Record<Key, Partial<Record<Key, string>>>> = {
  XAU: {
    ETF: "ETF buying is the strongest driver of gold price action",
    TIPS: "Real yields remain the dominant macro inverse to gold",
    SGE: "Chinese physical premium rises with gold price momentum",
    COT: "Smart money positioning tracks price direction",
    COMEX: "Inventory drawdowns accompany price rallies",
    BTC: "Gold and BTC remain largely decorrelated",
  },
  ETF: {
    TIPS: "ETF flows and real yields move in opposite directions",
    SGE: "Asian physical demand correlates with Western ETF buying",
    COMEX: "ETF accumulation coincides with COMEX inventory pressure",
  },
  TIPS: {
    SGE: "Real yield moves have moderate inverse effect on Asian premiums",
    COT: "Dealer positioning anticipates real yield shifts",
  },
};

function defaultInterpretation(value: number, a: string, b: string): string {
  const abs = Math.abs(value);
  const dir = value > 0 ? "positive" : "negative";
  if (abs > 0.6) return `Strong ${dir} relationship between ${a} and ${b}`;
  if (abs > 0.3) return `Moderate ${dir} relationship between ${a} and ${b}`;
  return `Weak ${dir} relationship between ${a} and ${b}`;
}

function buildInsights(): Insight[] {
  const pairs: { a: Key; b: Key; value: number }[] = [];
  for (let i = 0; i < ORDER.length; i++) {
    for (let j = i + 1; j < ORDER.length; j++) {
      pairs.push({ a: ORDER[i], b: ORDER[j], value: CORRELATION_DATA[ORDER[i]][ORDER[j]] });
    }
  }
  pairs.sort((x, y) => Math.abs(y.value) - Math.abs(x.value));

  return pairs.slice(0, 5).map((p) => {
    const interp =
      INSIGHT_INTERPRETATIONS[p.a]?.[p.b] ??
      INSIGHT_INTERPRETATIONS[p.b]?.[p.a] ??
      defaultInterpretation(p.value, LABELS[p.a], LABELS[p.b]);
    return { a: p.a, b: p.b, value: p.value, interpretation: interp };
  });
}

/* ------------------------------------------------------------------ */
/*  Tooltip                                                           */
/* ------------------------------------------------------------------ */

function Tooltip({
  rowKey,
  colKey,
  value,
  position,
}: {
  rowKey: Key;
  colKey: Key;
  value: number;
  position: { x: number; y: number } | null;
}) {
  if (!position) return null;

  const strength = correlationStrength(value);
  const direction = correlationDirection(value);

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-gold/30 bg-[#0C0C14]/95 px-3 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-sm"
      style={{
        left: position.x + 12,
        top: position.y - 8,
        transform: "translateY(-100%)",
      }}
    >
      <div className="text-[10px] uppercase tracking-[0.12em] text-text-muted mb-1">
        {strength} {direction}
      </div>
      <div className="text-xs text-text-primary font-mono">
        <span className="text-gold">{LABELS[rowKey]}</span>
        {" ↔ "}
        <span className="text-gold">{LABELS[colKey]}</span>
      </div>
      <div className="text-sm font-mono text-text-primary mt-0.5">
        {value > 0 ? "+" : ""}
        {value.toFixed(2)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Legend bar                                                        */
/* ------------------------------------------------------------------ */

function Legend() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.12em] text-text-muted">
          Correlation Scale
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Gradient bar */}
      <div
        className="h-2 w-full rounded-full"
        style={{
          background:
            "linear-gradient(to right, var(--red), rgba(239,68,68,0.4), rgba(100,100,100,0.2), rgba(34,197,94,0.4), var(--green))",
        }}
      />

      {/* Labels */}
      <div className="flex justify-between text-[10px] font-mono text-text-muted">
        <span>-1.0</span>
        <span>-0.5</span>
        <span>0.0</span>
        <span>+0.5</span>
        <span>+1.0</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Insight panel                                                     */
/* ------------------------------------------------------------------ */

function InsightPanel({ insights }: { insights: Insight[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_6px_var(--gold-glow)]" />
        <h3 className="text-xs uppercase tracking-[0.16em] text-text-secondary">
          Key Relationships
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        {insights.map((insight, i) => (
          <div
            key={`${insight.a}-${insight.b}`}
            className="group rounded-xl border border-border bg-surface/60 p-4 transition-all duration-200 hover:border-gold/30 hover:bg-surface"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono text-text-muted tabular-nums shrink-0">
                  #{i + 1}
                </span>
                <span className="text-xs font-mono text-text-primary truncate">
                  <span className="text-gold">{SHORT_LABELS[insight.a]}</span>
                  {" ↔ "}
                  <span className="text-gold">{SHORT_LABELS[insight.b]}</span>
                </span>
              </div>
              <span
                className="text-sm font-mono tabular-nums shrink-0 ml-2"
                style={{
                  color:
                    Math.abs(insight.value) > 0.3
                      ? insight.value > 0
                        ? "var(--green)"
                        : "var(--red)"
                      : "var(--text-muted)",
                }}
              >
                {insight.value > 0 ? "+" : ""}
                {insight.value.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-text-muted">
              {insight.interpretation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export function CorrelationMatrix() {
  const [hovered, setHovered] = useState<{ row: Key; col: Key } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const insights = useMemo(() => buildInsights(), []);

  const handleCellEnter = useCallback(
    (row: Key, col: Key, e: React.MouseEvent<HTMLDivElement>) => {
      setHovered({ row, col });
      setTooltipPos({ x: e.clientX, y: e.clientY });
    },
    [],
  );

  const handleCellMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleCellLeave = useCallback(() => {
    setHovered(null);
    setTooltipPos(null);
  }, []);

  const isHovered = (row: Key, col: Key) =>
    hovered?.row === row && hovered?.col === col;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_6px_var(--gold-glow)]" />
          <h2 className="font-display text-lg text-text-primary">
            Correlation Matrix
          </h2>
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted mt-0.5">
          30-Day Rolling
        </span>
      </div>

      {/* ── Matrix + Insights layout ── */}
      <div className="flex flex-col gap-6 xl:flex-row xl:gap-8">
        {/* ── Matrix ── */}
        <div className="flex-1 overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Grid: 1 header row + 7 data rows, 1 label col + 7 data cols */}
            <div
              className="grid gap-px rounded-xl border border-border bg-border overflow-hidden"
              style={{
                gridTemplateColumns: `72px repeat(7, minmax(48px, 1fr))`,
                gridTemplateRows: `36px repeat(7, minmax(48px, 1fr))`,
              }}
            >
              {/* Top-left corner */}
              <div className="flex items-center justify-center bg-surface/80">
                <span className="text-[9px] uppercase tracking-[0.1em] text-text-muted">
                  vs
                </span>
              </div>

              {/* Column headers */}
              {ORDER.map((key) => (
                <div
                  key={`col-${key}`}
                  className={cn(
                    "flex items-center justify-center bg-surface/80 px-1",
                    key === "XAU" && "bg-gold/5",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-mono tracking-[0.06em]",
                      key === "XAU" ? "text-gold" : "text-text-secondary",
                    )}
                    title={LABELS[key]}
                  >
                    {SHORT_LABELS[key]}
                  </span>
                </div>
              ))}

              {/* Data rows */}
              {ORDER.map((rowKey) => (
                <div key={`row-${rowKey}`} className="contents">
                  {/* Row label */}
                  <div
                    className={cn(
                      "flex items-center justify-end bg-surface/80 px-2",
                      rowKey === "XAU" && "bg-gold/5",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-mono tracking-[0.06em]",
                        rowKey === "XAU" ? "text-gold" : "text-text-secondary",
                      )}
                      title={LABELS[rowKey]}
                    >
                      {SHORT_LABELS[rowKey]}
                    </span>
                  </div>

                  {/* Row cells */}
                  {ORDER.map((colKey) => {
                    const value = CORRELATION_DATA[rowKey][colKey];
                    const diagonal = rowKey === colKey;
                    const hover = isHovered(rowKey, colKey);

                    return (
                      <div
                        key={`${rowKey}-${colKey}`}
                        className={cn(
                          "relative flex items-center justify-center cursor-default transition-all duration-150",
                          diagonal ? "bg-gold/5" : "bg-surface",
                          hover && "z-10 scale-[1.08]",
                        )}
                        style={{
                          backgroundColor: diagonal ? undefined : correlationColor(value),
                        }}
                        onMouseEnter={(e) => handleCellEnter(rowKey, colKey, e)}
                        onMouseMove={handleCellMove}
                        onMouseLeave={handleCellLeave}
                      >
                        {/* Diagonal: gold "1.00" */}
                        {diagonal ? (
                          <span className="text-xs font-mono text-gold tabular-nums select-none">
                            1.00
                          </span>
                        ) : (
                          <span
                            className="text-xs font-mono tabular-nums select-none"
                            style={{ color: correlationTextColor(value) }}
                          >
                            {value > 0 ? "+" : ""}
                            {value.toFixed(2)}
                          </span>
                        )}

                        {/* Hover ring */}
                        {hover && (
                          <div className="absolute inset-0 ring-1 ring-inset ring-gold/60 pointer-events-none rounded-[3px]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-5">
            <Legend />
          </div>
        </div>

        {/* ── Insight Panel ── */}
        <div className="w-full xl:w-80 shrink-0">
          <InsightPanel insights={insights} />
        </div>
      </div>

      {/* Tooltip */}
      {hovered && (
        <Tooltip
          rowKey={hovered.row}
          colKey={hovered.col}
          value={CORRELATION_DATA[hovered.row][hovered.col]}
          position={tooltipPos}
        />
      )}
    </div>
  );
}

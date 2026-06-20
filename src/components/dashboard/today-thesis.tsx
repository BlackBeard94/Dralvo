"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CircleMinus,
  GitCompareArrows,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type {
  AiSignal,
} from "@/lib/intelligence/ai-signal";
import type {
  GoldThesis,
  TradeSimulation,
  ThesisDriverState,
} from "@/lib/intelligence/gold-thesis";
import { localizeThesis } from "@/lib/intelligence/localize-thesis";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const stateStyle = {
  supportive: "border-green/30 bg-green/5 text-green",
  adverse: "border-red/30 bg-red/5 text-red",
  mixed: "border-gold/30 bg-gold/5 text-gold",
  insufficient_data: "border-border bg-surface text-text-muted",
} as const;

const relationshipStyle = {
  confirming: "border-green/30 bg-green/5 text-green",
  diverging: "border-gold/40 bg-gold/5 text-gold",
  neutral: "border-border bg-card text-text-secondary",
  insufficient_data: "border-border bg-card text-text-muted",
} as const;

const simulationStyle = {
  simulated_buy: "border-green/40 bg-green/10 text-green",
  simulated_sell: "border-red/40 bg-red/10 text-red",
  stand_aside: "border-gold/40 bg-gold/10 text-gold",
} as const;

const simulationCopy = {
  vi: {
    eyebrow: "AI tóm tắt",
    confidence: "Độ tin cậy",
    priceBasis: "Giá tham chiếu",
    entry: "Vùng vào",
    stopLoss: "SL",
    takeProfit: "TP mô phỏng",
    invalidation: "Vô hiệu nếu",
    noTrade: "Không mở vị thế",
    details: "Xem bằng chứng chi tiết",
    disclaimer: "Mô phỏng giáo dục, không phải khuyến nghị mua/bán.",
    button: "Tạo AI signal",
    loading: "AI đang tổng hợp...",
    error: "Không tạo được AI signal.",
    manual: "Khung giá hệ thống",
    confidenceValues: {
      high: "Cao",
      medium: "Trung bình",
      low: "Thấp",
    },
  },
  en: {
    eyebrow: "AI brief",
    confidence: "Confidence",
    priceBasis: "Reference price",
    entry: "Entry zone",
    stopLoss: "SL",
    takeProfit: "Simulated TP",
    invalidation: "Invalid if",
    noTrade: "No position",
    details: "View detailed evidence",
    disclaimer: "Educational simulation, not a buy/sell recommendation.",
    button: "Generate AI signal",
    loading: "AI is summarizing...",
    error: "Could not generate AI signal.",
    manual: "System price frame",
    confidenceValues: {
      high: "High",
      medium: "Medium",
      low: "Low",
    },
  },
  "pt-BR": {
    eyebrow: "Resumo IA",
    confidence: "Confiança",
    priceBasis: "Preço de referência",
    entry: "Zona de entrada",
    stopLoss: "SL",
    takeProfit: "TP simulado",
    invalidation: "Invalida se",
    noTrade: "Sem posição",
    details: "Ver evidências detalhadas",
    disclaimer: "Simulação educacional, não recomendação de compra/venda.",
    button: "Gerar sinal IA",
    loading: "IA resumindo...",
    error: "Não foi possível gerar o sinal IA.",
    manual: "Quadro de preço do sistema",
    confidenceValues: {
      high: "Alta",
      medium: "Media",
      low: "Baixa",
    },
  },
} as const;

function formatPrice(value: number | null, locale: string) {
  if (value === null) return "-";
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatRange(range: TradeSimulation["entryZone"], locale: string) {
  if (!range) return "-";
  return `${formatPrice(range.from, locale)} - ${formatPrice(range.to, locale)}`;
}

function DriverRow({
  driver,
  states,
}: {
  driver: ThesisDriverState;
  states: Record<string, string>;
}) {
  const Icon =
    driver.state === "supportive"
      ? ArrowUpRight
      : driver.state === "adverse"
        ? ArrowDownRight
        : driver.state === "missing" || driver.state === "stale"
          ? AlertTriangle
          : CircleMinus;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            driver.state === "supportive"
              ? "text-green"
              : driver.state === "adverse"
                ? "text-red"
                : "text-gold",
          )}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-text-primary">
              {driver.label}
            </h3>
            <span className="rounded-full border border-border px-2 py-0.5 text-[13px] uppercase tracking-wider text-text-muted">
              {states[driver.state]}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-text-secondary">
            {driver.evidence}
          </p>
          <p className="mt-2 text-[12px] leading-4 text-text-muted">
            Rule: {driver.rule}
          </p>
        </div>
      </div>
    </div>
  );
}

function SimulationCard({
  simulation,
  signal,
  signalError,
  signalLoading,
  locale,
  onGenerate,
}: {
  simulation: TradeSimulation;
  signal: AiSignal | null;
  signalError: string | null;
  signalLoading: boolean;
  locale: string;
  onGenerate: () => void;
}) {
  const copy = simulationCopy[locale as keyof typeof simulationCopy] ?? simulationCopy.en;
  const localeCode = locale === "pt-BR" ? "pt-BR" : locale;
  const isDirectional = simulation.action !== "stand_aside";
  const displayedAction = signal?.action ?? simulation.action;
  const actionLabel =
    displayedAction === "simulated_buy"
      ? "BUY"
      : displayedAction === "simulated_sell"
        ? "SELL"
        : copy.noTrade;

  return (
    <div className="mt-5 rounded-2xl border border-border-gold bg-gradient-to-br from-gold/10 via-card to-surface p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-gold">
            <Sparkles className="h-4 w-4" />
            {copy.eyebrow}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold tracking-[0.12em]",
                simulationStyle[displayedAction],
              )}
            >
              {actionLabel}
            </span>
            <h3 className="font-display text-2xl text-text-primary">
              {signal?.headline ?? simulation.title}
            </h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            {signal?.summary ?? simulation.summary}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={onGenerate}
            disabled={signalLoading}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-deep transition-colors hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signalLoading ? copy.loading : copy.button}
          </button>
          <div className="rounded-xl border border-border bg-deep/60 px-4 py-3 text-right">
          <p className="text-[12px] uppercase tracking-wider text-text-muted">
            {copy.confidence}
          </p>
          <p className="mt-1 font-display text-xl text-text-primary">
            {copy.confidenceValues[signal?.confidence ?? simulation.confidence]}
          </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {[
          [copy.priceBasis, formatPrice(simulation.priceBasis, localeCode)],
          [
            copy.entry,
            isDirectional ? formatRange(simulation.entryZone, localeCode) : "-",
          ],
          [copy.stopLoss, formatPrice(simulation.stopLoss, localeCode)],
          [
            copy.takeProfit,
            simulation.takeProfit
              ? simulation.takeProfit
                  .map((price) => formatPrice(price, localeCode))
                  .join(" / ")
              : "-",
          ],
          [copy.invalidation, formatPrice(simulation.invalidation, localeCode)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card/80 p-3">
            <p className="text-[12px] uppercase tracking-wider text-text-muted">
              {label}
            </p>
            <p className="mt-2 font-mono text-sm text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <ul className="grid gap-2 text-xs leading-5 text-text-muted md:grid-cols-3">
          {(signal?.bullets ?? simulation.rationale).slice(0, 3).map((reason) => (
            <li key={reason} className="flex gap-2">
              <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-[12px] text-gold">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {copy.disclaimer}
        </p>
      </div>
      {signal && (
        <div className="mt-4 rounded-xl border border-border bg-deep/50 p-3">
          <p className="text-[12px] uppercase tracking-wider text-text-muted">
            {copy.manual}
          </p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {signal.setup}
          </p>
          <p className="mt-2 text-xs leading-5 text-gold">{signal.riskNote}</p>
        </div>
      )}
      {signalError && (
        <p className="mt-3 rounded-lg border border-red/30 bg-red/5 px-3 py-2 text-xs text-red">
          {copy.error} {signalError}
        </p>
      )}
    </div>
  );
}

export function TodayThesis() {
  const [thesis, setThesis] = useState<GoldThesis | null>(null);
  const [aiSignal, setAiSignal] = useState<AiSignal | null>(null);
  const [aiSignalError, setAiSignalError] = useState<string | null>(null);
  const [aiSignalLoading, setAiSignalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale];
  const displayThesis = thesis ? localizeThesis(thesis, locale) : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/thesis/today", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.thesis) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      setThesis(data.thesis);
      setAiSignal(null);
      setAiSignalError(null);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Thesis unavailable",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const generateSignal = useCallback(async () => {
    setAiSignalLoading(true);
    setAiSignalError(null);
    try {
      const response = await fetch("/api/thesis/ai-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = (await response.json()) as {
        signal?: AiSignal;
        error?: string;
      };
      if (!response.ok || !data.signal) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      setAiSignal(data.signal);
    } catch (signalError) {
      setAiSignalError(
        signalError instanceof Error
          ? signalError.message
          : "AI signal unavailable",
      );
    } finally {
      setAiSignalLoading(false);
    }
  }, [locale]);

  if (!displayThesis) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-text-secondary">
          {loading ? copy.today.loading : copy.today.unavailable}
        </p>
        {error && <p className="mt-2 font-mono text-xs text-red">{error}</p>}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-gold">
            {copy.today.eyebrow}
          </p>
          <h2 className="mt-2 font-display text-2xl text-text-primary">
            {displayThesis.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            {displayThesis.summary}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] uppercase tracking-wider",
              stateStyle[displayThesis.state],
            )}
          >
            {copy.states[displayThesis.state]}
          </span>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-border p-2 text-text-muted hover:border-border-gold hover:text-gold"
            aria-label="Refresh thesis"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <SimulationCard
        simulation={displayThesis.tradeSimulation}
        signal={aiSignal}
        signalError={aiSignalError}
        signalLoading={aiSignalLoading}
        locale={locale}
        onGenerate={() => void generateSignal()}
      />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [copy.today.coverage[0], displayThesis.coverage.available],
          [copy.today.coverage[1], displayThesis.coverage.required],
          [copy.today.coverage[2], displayThesis.coverage.stale],
          [copy.today.coverage[3], displayThesis.coverage.missing],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[13px] uppercase tracking-wider text-text-muted">
              {label}
            </p>
            <p className="mt-1 font-mono text-lg text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      <details className="mt-5 rounded-xl border border-border bg-card/60 p-4">
        <summary className="cursor-pointer select-none text-sm font-semibold text-gold">
          {(simulationCopy[locale as keyof typeof simulationCopy] ?? simulationCopy.en).details}
        </summary>

      {displayThesis.priceRelationship && (
        <div
          className={cn(
            "mt-4 rounded-xl border p-4",
            relationshipStyle[displayThesis.priceRelationship.state],
          )}
        >
          <div className="flex items-start gap-3">
            <GitCompareArrows className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-[12px] uppercase tracking-[0.14em] opacity-75">
                {copy.today.relationshipHeading}
              </p>
              <h3 className="mt-1 font-display text-lg text-text-primary">
                {displayThesis.priceRelationship.title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                {displayThesis.priceRelationship.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {displayThesis.drivers.map((driver) => (
          <DriverRow key={driver.driverKey} driver={driver} states={copy.states} />
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs uppercase tracking-[0.14em] text-text-secondary">
          {copy.today.changeHeading}
        </h3>
        <ul className="mt-3 grid gap-2 text-xs leading-5 text-text-muted md:grid-cols-2">
          {displayThesis.changeConditions.map((condition) => (
            <li key={condition}>• {condition}</li>
          ))}
        </ul>
      </div>
      </details>

      <p className="mt-4 text-[12px] text-text-muted">
        {copy.today.methodology} {displayThesis.methodologyVersion} ·{" "}
        {copy.today.generated}{" "}
        {new Date(displayThesis.generatedAt).toLocaleString(
          locale === "pt-BR" ? "pt-BR" : locale,
        )} ·{" "}
        {copy.today.disclaimer}
      </p>
    </section>
  );
}

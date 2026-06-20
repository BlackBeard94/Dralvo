"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  createSeriesMarkers,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  Bot,
  CheckCircle2,
  Database,
  Gauge,
  LineChart,
  Loader2,
  Maximize2,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  SkipBack,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLocale } from "@/hooks/use-locale";
import {
  buildSampleCandles,
  parseStrategyPrompt,
  runStrategyBacktest,
  type BacktestResult,
  type StrategySpec,
} from "@/lib/backtest/strategy-lab";
import { MARKET_DATA_SYMBOLS, MARKET_DATA_TIMEFRAMES } from "@/lib/market-data/catalog";
import { parseMarketCandlesCsv } from "@/lib/market-data/csv";
import type {
  MarketCandle,
  MarketDatasetManifest,
  MarketDatasetManifestItem,
  MarketDataTimeframe,
} from "@/lib/market-data/types";
import { withLocaleFallback } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SERIF = "'DM Serif Display', 'Playfair Display', 'Times New Roman', serif";

const SAMPLE_STRATEGIES = [
  {
    id: "ema-cross",
    name: "EMA 20/50 Crossover",
    badge: "Trend",
    description: "Cross EMA nhanh/chậm, dùng ATR để đặt stop và target.",
    prompt:
      "Buy when EMA 20 crosses above EMA 50. Sell when EMA 20 crosses below EMA 50. Use 1.5 ATR stop, 3 ATR target, risk 1% per trade.",
  },
  {
    id: "rsi-reversion",
    name: "RSI Mean Reversion",
    badge: "Mean reversion",
    description: "Mua vùng quá bán, bán vùng quá mua, kiểm soát rủi ro theo ATR.",
    prompt:
      "Buy when RSI 14 is below 32. Sell when RSI 14 is above 68. Use 1 ATR stop, 2 ATR target, risk 1% per trade.",
  },
  {
    id: "breakout",
    name: "48 Candle Breakout",
    badge: "Breakout",
    description: "Vào lệnh khi giá phá đỉnh/đáy của vùng lookback.",
    prompt:
      "Buy when price closes above the highest high of the last 48 candles. Sell when price closes below the lowest low of the last 48 candles. Use 2 ATR stop, 4 ATR target, risk 1% per trade.",
  },
  {
    id: "london-breakout",
    name: "London Breakout",
    badge: "Planned",
    description: "Mẫu nâng cao để AI báo thiếu engine session/range nếu chưa hỗ trợ.",
    prompt:
      "Trade the London breakout: mark the Asian session high and low, buy a breakout above the range, sell a breakout below the range, filter false breaks, use ATR stop and 2R target.",
  },
  {
    id: "smc-liquidity",
    name: "SMC Liquidity Sweep",
    badge: "Unsupported",
    description: "Mẫu để kiểm tra logic không ép chiến lược lạ vào template cũ.",
    prompt:
      "Wait for a liquidity sweep, confirm an H4 order block, enter at fair value gap mitigation, use trailing stop after 1R.",
  },
] as const;

const DEFAULT_PROMPT = "";
const DEFAULT_STRATEGY_SPEC = parseStrategyPrompt(SAMPLE_STRATEGIES[0].prompt);

type AiParseResponse = {
  spec?: StrategySpec;
  source?: "deepseek" | "local-fallback";
  supported?: boolean;
  summary?: string | null;
  assumptions?: string[];
  warning?: string;
  unsupportedReason?: string | null;
  missingFeatures?: string[];
  closestTemplate?: StrategySpec["template"] | null;
  error?: string;
};

const BACKTEST_COPY = withLocaleFallback({
  en: {
    navHome: "Home",
    sidebarEyebrow: "Free strategy lab",
    sidebarTitle: "Type an idea. Test the edge.",
    sidebarBody:
      "Dralvo converts plain-English trading rules into a controlled backtest spec, then runs it on cached forex data in the browser.",
    dataset: "Dataset",
    symbol: "Symbol",
    timeframe: "Timeframe",
    startDate: "Start",
    endDate: "End",
    cachedData: "Cached market data",
    sampleData: "Synthetic preview data",
    candlesLoaded: "candles loaded for",
    seedHint: "Seed Twelve Data or Dukascopy CSV to replace this sample.",
    nextDataStep: "Next data step",
    dataStepBody:
      "Default datasets live under /market-data. Later we can add user CSV upload here without sending files to the server.",
    parserReady: "AI parser ready",
    heroTitle: "AI Backtest Lab",
    heroBody: "DeepSeek converts the prompt into a validated strategy spec before the backtest runs.",
    run: "Run backtest",
    parsing: "AI parsing",
    strategyPrompt: "Strategy prompt",
    promptPlaceholder: "Describe your strategy...",
    parseRules: "AI parse",
    createCampaign: "Create campaign & backtest",
    sampleStrategies: "Sample strategies",
    aiSource: "Source",
    aiError: "AI parser error",
    example: "Example",
    parsedSpec: "Parsed spec",
    direction: "Direction",
    risk: "Risk",
    stop: "Stop",
    target: "Target",
    perTrade: "per trade",
    netReturn: "Net return",
    profitFactor: "Profit factor",
    maxDrawdown: "Max drawdown",
    trades: "Trades",
    equityCurve: "Equity curve",
    netReturnSuffix: "net return",
    runToSeeEquity: "Run a backtest to see equity",
    clientSimulation: "Client-side simulation",
    edgeDetector: "Edge detector",
    waitingRun: "Waiting for a run",
    edgeSaved: "Edge candidate saved",
    noEdge: "No edge yet",
    needsTrades: "Needs enough trades",
    edgeSavedBody:
      "This strategy passes the first PF, expectancy, trade count, and drawdown filter. In production this will notify admin review.",
    edgeDefaultBody:
      "Dralvo only flags a strategy after it has enough trades, positive expectancy, PF above 1.3, and controlled drawdown.",
    winRate: "Win rate",
    expectancy: "Expectancy",
    adminAlert: "Admin alert",
    queued: "queued",
    off: "off",
    tradeLedger: "Trade ledger",
    tradeLedgerTitle: "Every simulated trade stays visible",
    rerun: "Re-run",
    ledgerEmpty: "Run a backtest to generate the ledger.",
    ledgerHeaders: ["#", "Direction", "Entry", "Exit", "PnL", "R", "Reason"],
    openTester: "Open visual tester",
    tester: {
      title: "Strategy tester visual mode",
      subtitle: "MT5-style replay of candles, entries, exits, and current price.",
      play: "Play",
      pause: "Pause",
      reset: "Reset",
      close: "Close",
      speed: "Speed",
      slower: "Slow",
      faster: "Fast",
      progress: "Progress",
      current: "Current candle",
      entries: "Entries",
      exits: "Exits",
      noRun: "Run a backtest first to open the visual tester.",
    },
  },
  vi: {
    navHome: "Trang chủ",
    sidebarEyebrow: "Phòng lab chiến lược miễn phí",
    sidebarTitle: "Nhập ý tưởng. Kiểm tra edge.",
    sidebarBody:
      "Dralvo chuyển luật giao dịch thành cấu hình backtest có kiểm soát, rồi chạy trên dữ liệu forex đã cache ngay trong trình duyệt.",
    dataset: "Dữ liệu",
    symbol: "Mã",
    timeframe: "Khung thời gian",
    cachedData: "Dữ liệu thị trường đã cache",
    sampleData: "Dữ liệu mô phỏng tạm",
    candlesLoaded: "nến đã nạp cho",
    seedHint: "Nạp Twelve Data hoặc CSV Dukascopy để thay dữ liệu mẫu này.",
    nextDataStep: "Bước dữ liệu tiếp theo",
    dataStepBody:
      "Dữ liệu mặc định nằm trong /market-data. Sau này có thể thêm upload CSV phía người dùng mà không gửi file lên server.",
    parserReady: "AI parser sẵn sàng",
    heroTitle: "Backtest chiến lược trước khi biến thành EA.",
    heroBody:
      "Bản đầu dùng parser có kiểm soát cho EMA, RSI và breakout. Lớp tiếp theo có thể nối LLM thật để tạo cùng cấu hình chiến lược an toàn.",
    run: "Chạy backtest",
    strategyPrompt: "Prompt chiến lược",
    promptPlaceholder: "Mô tả chiến lược của bạn...",
    parseRules: "Đọc luật",
    createCampaign: "Tạo chiến dịch & backtest",
    sampleStrategies: "Chiến lược mẫu",
    example: "Ví dụ",
    parsedSpec: "Cấu hình đã đọc",
    direction: "Hướng lệnh",
    risk: "Rủi ro",
    stop: "Stop",
    target: "Target",
    perTrade: "mỗi lệnh",
    netReturn: "Lợi nhuận ròng",
    profitFactor: "Profit factor",
    maxDrawdown: "Drawdown tối đa",
    trades: "Số lệnh",
    equityCurve: "Đường vốn",
    netReturnSuffix: "lợi nhuận ròng",
    runToSeeEquity: "Chạy backtest để xem đường vốn",
    clientSimulation: "Mô phỏng phía client",
    edgeDetector: "Bộ lọc edge",
    waitingRun: "Đang chờ chạy",
    edgeSaved: "Đã lưu ứng viên có edge",
    noEdge: "Chưa có edge",
    needsTrades: "Cần đủ số lệnh",
    edgeSavedBody:
      "Chiến lược vượt bộ lọc đầu tiên về PF, expectancy, số lệnh và drawdown. Khi production, mục này sẽ báo cho admin duyệt.",
    edgeDefaultBody:
      "Dralvo chỉ đánh dấu chiến lược sau khi đủ lệnh, expectancy dương, PF trên 1.3 và drawdown được kiểm soát.",
    winRate: "Tỷ lệ thắng",
    expectancy: "Expectancy",
    adminAlert: "Báo admin",
    queued: "đã xếp hàng",
    off: "tắt",
    tradeLedger: "Nhật ký lệnh",
    tradeLedgerTitle: "Mọi lệnh mô phỏng đều được giữ lại",
    rerun: "Chạy lại",
    ledgerEmpty: "Chạy backtest để tạo nhật ký lệnh.",
    ledgerHeaders: ["#", "Hướng", "Vào", "Thoát", "PnL", "R", "Lý do"],
    openTester: "Mở biểu đồ mô phỏng",
    tester: {
      title: "Chế độ visual strategy tester",
      subtitle: "Replay kiểu MT5: nến, điểm vào, điểm thoát và giá hiện tại.",
      play: "Chạy",
      pause: "Tạm dừng",
      reset: "Về đầu",
      close: "Đóng",
      speed: "Tốc độ",
      slower: "Chậm",
      faster: "Nhanh",
      progress: "Tiến trình",
      current: "Nến hiện tại",
      entries: "Điểm vào",
      exits: "Điểm thoát",
      noRun: "Hãy chạy backtest trước để mở biểu đồ mô phỏng.",
    },
  },
});

function formatPct(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(2);
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "warn";
}) {
  return (
    <article className="rounded-lg border border-border bg-card/75 p-4">
      <p className="text-[12px] uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 font-mono text-2xl font-semibold text-text-primary",
          tone === "good" && "text-green",
          tone === "bad" && "text-red",
          tone === "warn" && "text-gold",
        )}
      >
        {value}
      </p>
    </article>
  );
}

function SpecInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="grid gap-1.5 rounded-lg border border-border bg-deep/35 px-3 py-2">
      <span className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
        {label}
      </span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) onChange(next);
          }}
          className="h-9 min-w-0 flex-1 rounded-md border border-border bg-[#080A0F] px-2 font-mono text-sm font-semibold text-[#F5F2EA] outline-none transition focus:border-gold/60"
        />
        {suffix && <span className="text-xs text-text-muted">{suffix}</span>}
      </span>
    </label>
  );
}

function EquityChart({
  result,
  copy,
}: {
  result: BacktestResult | null;
  copy: (typeof BACKTEST_COPY)["en"];
}) {
  const values = result?.equityCurve.length ? result.equityCurve : [10000, 10050, 10020, 10130, 10210];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const path = values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 760;
      const y = 240 - ((value - min) / span) * 190;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const fillPath = `${path} L 760 260 L 0 260 Z`;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface/85">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.14em] text-text-muted">
            {copy.equityCurve}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-text-primary">
            {result
              ? `${formatPct(result.netReturnPct)} ${copy.netReturnSuffix}`
              : copy.runToSeeEquity}
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card/70 px-3 py-2 text-xs text-text-muted">
          <LineChart className="h-4 w-4 text-green" />
          {copy.clientSimulation}
        </div>
      </div>
      <div className="relative h-[320px] p-5">
        <div className="absolute inset-x-5 top-16 h-px bg-border/70" />
        <div className="absolute inset-x-5 top-32 h-px bg-border/50" />
        <div className="absolute inset-x-5 top-48 h-px bg-border/50" />
        <svg
          viewBox="0 0 760 280"
          className="relative h-full w-full overflow-visible"
          role="img"
          aria-label="Backtest equity curve"
        >
          <defs>
            <linearGradient id="backtest-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(59,168,126,0.32)" />
              <stop offset="100%" stopColor="rgba(59,168,126,0)" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill="url(#backtest-fill)" />
          <path
            d={path}
            fill="none"
            stroke="#3BA87E"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
        </svg>
      </div>
    </section>
  );
}

function describeSpec(spec: StrategySpec) {
  if (spec.template === "ema-cross") {
    return `EMA ${spec.fastEma}/${spec.slowEma} crossover`;
  }
  if (spec.template === "rsi-reversion") {
    return `RSI ${spec.rsiPeriod} mean reversion`;
  }
  return `${spec.breakoutLookback} candle breakout`;
}

function formatCandleTime(time: string) {
  return time.slice(0, 16).replace("T", " ");
}

function getTradeIndex(candles: MarketCandle[], time: string) {
  const index = candles.findIndex((candle) => candle.time >= time);
  return index >= 0 ? index : candles.length - 1;
}

function toChartTime(time: string): UTCTimestamp {
  return Math.floor(new Date(time).getTime() / 1000) as UTCTimestamp;
}

function TradingViewReplayChart({
  candles,
  result,
  cursor,
}: {
  candles: MarketCandle[];
  result: BacktestResult | null;
  cursor: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#080a0f" },
        textColor: "rgba(228,231,239,0.72)",
        fontFamily: "Inter, system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.08)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.12)",
        scaleMargins: { top: 0.12, bottom: 0.12 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.12)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: 14,
      },
      localization: {
        priceFormatter: (price: number) => price.toFixed(price > 20 ? 2 : 5),
      },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#3BA87E",
      downColor: "#D95C5C",
      borderUpColor: "#3BA87E",
      borderDownColor: "#D95C5C",
      wickUpColor: "#7DD9B5",
      wickDownColor: "#F07F7F",
      priceLineColor: "#E2B85C",
      priceLineWidth: 1,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const markers = markersRef.current;
    if (!chart || !series || !markers || !candles.length) return;

    const currentCandles = candles.slice(0, cursor + 1);
    const chartData: CandlestickData<Time>[] = currentCandles.map((candle) => ({
      time: toChartTime(candle.time),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    series.setData(chartData);

    const markerData: SeriesMarker<Time>[] = [];
    for (const trade of result?.trades ?? []) {
      const entryIndex = getTradeIndex(candles, trade.entryTime);
      const exitIndex = getTradeIndex(candles, trade.exitTime);
      const entryTime = candles[entryIndex]?.time;
      const exitTime = candles[exitIndex]?.time;

      if (entryTime && entryIndex <= cursor) {
        markerData.push({
          time: toChartTime(entryTime),
          position: trade.direction === "long" ? "belowBar" : "aboveBar",
          shape: trade.direction === "long" ? "arrowUp" : "arrowDown",
          color: "#E2B85C",
          text: `#${trade.id} ${trade.direction}`,
        });
      }

      if (exitTime && exitIndex <= cursor) {
        markerData.push({
          time: toChartTime(exitTime),
          position: trade.rMultiple >= 0 ? "aboveBar" : "belowBar",
          shape: "circle",
          color: trade.rMultiple >= 0 ? "#3BA87E" : "#D95C5C",
          text: `${trade.rMultiple.toFixed(1)}R`,
        });
      }
    }

    markers.setMarkers(markerData);
    chart.timeScale().setVisibleLogicalRange({
      from: Math.max(0, currentCandles.length - 58),
      to: currentCandles.length + 5,
    });
  }, [candles, cursor, result]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#080a0f]">
      <div ref={containerRef} className="h-[460px] min-w-[760px] sm:min-w-0" />
    </div>
  );
}

function StrategyTesterModal({
  open,
  onClose,
  candles,
  result,
  speed,
  setSpeed,
  symbolLabel,
  timeframe,
  copy,
}: {
  open: boolean;
  onClose: () => void;
  candles: MarketCandle[];
  result: BacktestResult | null;
  speed: number;
  setSpeed: (value: number) => void;
  symbolLabel: string;
  timeframe: MarketDataTimeframe;
  copy: (typeof BACKTEST_COPY)["en"]["tester"];
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);
  const hasRun = Boolean(result && candles.length > 0);
  const currentCandle = candles[cursor] ?? null;
  const maxCursor = Math.max(0, candles.length - 1);
  const progress = maxCursor ? Math.round((cursor / maxCursor) * 100) : 0;

  useEffect(() => {
    if (!open) {
      setIsPlaying(false);
      return;
    }
    setCursor(Math.min(Math.max(80, Math.floor(candles.length * 0.12)), maxCursor));
  }, [candles.length, maxCursor, open]);

  useEffect(() => {
    if (!open || !isPlaying || !hasRun) return;
    const delay = Math.max(45, 740 - speed * 68);
    const timer = window.setInterval(() => {
      setCursor((current) => {
        if (current >= maxCursor) {
          window.clearInterval(timer);
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, delay);
    return () => window.clearInterval(timer);
  }, [hasRun, isPlaying, maxCursor, open, speed]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-[#050609]/82 p-3 backdrop-blur-sm sm:p-6">
      <section className="mx-auto flex h-full max-w-[1180px] flex-col overflow-hidden rounded-lg border border-border bg-deep shadow-2xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <p className="text-[12px] uppercase tracking-[0.14em] text-gold">
              {symbolLabel} / {timeframe}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-text-primary">
              {copy.title}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{copy.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-text-muted transition hover:border-gold/40 hover:text-gold"
            aria-label={copy.close}
            title={copy.close}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {!hasRun ? (
          <div className="grid flex-1 place-items-center p-8 text-center text-text-muted">
            {copy.noRun}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/70 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying((current) => !current)}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-gold-action px-4 text-sm font-semibold text-[#060609] transition hover:bg-gold-actionHover"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? copy.pause : copy.play}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCursor(Math.min(80, maxCursor));
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm text-text-secondary transition hover:border-gold/40 hover:text-gold"
                >
                  <SkipBack className="h-4 w-4" />
                  {copy.reset}
                </button>
              </div>

              <label className="flex min-w-[260px] flex-1 items-center gap-3 text-sm text-text-secondary sm:max-w-[420px]">
                <span className="shrink-0">{copy.speed}</span>
                <span className="text-xs text-text-muted">{copy.slower}</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={speed}
                  onChange={(event) => setSpeed(Number(event.target.value))}
                  className="h-2 min-w-0 flex-1 accent-[var(--gold-primary)]"
                />
                <span className="text-xs text-text-muted">{copy.faster}</span>
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
              <div className="mb-3 grid gap-3 text-sm text-text-secondary sm:grid-cols-5">
                <div className="rounded-md border border-border bg-card/70 p-3">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-text-muted">
                    {copy.progress}
                  </p>
                  <p className="mt-1 font-mono text-lg text-text-primary">{progress}%</p>
                </div>
                <div className="rounded-md border border-border bg-card/70 p-3 sm:col-span-2">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-text-muted">
                    {copy.current}
                  </p>
                  <p className="mt-1 font-mono text-lg text-text-primary">
                    {currentCandle ? formatCandleTime(currentCandle.time) : "-"}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-card/70 p-3">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-text-muted">
                    O / H / L / C
                  </p>
                  {currentCandle ? (
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs text-text-primary">
                      <span>O {formatNumber(currentCandle.open)}</span>
                      <span>H {formatNumber(currentCandle.high)}</span>
                      <span>L {formatNumber(currentCandle.low)}</span>
                      <span>C {formatNumber(currentCandle.close)}</span>
                    </div>
                  ) : (
                    <p className="mt-1 font-mono text-sm text-text-primary">-</p>
                  )}
                </div>
                <div className="rounded-md border border-border bg-card/70 p-3">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-text-muted">
                    {copy.entries} / {copy.exits}
                  </p>
                  <p className="mt-1 font-mono text-lg text-text-primary">
                    {result?.trades.filter((trade) => getTradeIndex(candles, trade.entryTime) <= cursor).length ?? 0}
                    {" / "}
                    {result?.trades.filter((trade) => getTradeIndex(candles, trade.exitTime) <= cursor).length ?? 0}
                  </p>
                </div>
              </div>

              <TradingViewReplayChart candles={candles} result={result} cursor={cursor} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default function BacktestToolPage() {
  const { locale } = useLocale();
  const copy = BACKTEST_COPY[locale];
  const [symbol, setSymbol] = useState("xauusd");
  const [timeframe, setTimeframe] = useState<MarketDataTimeframe>("1h");
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [spec, setSpec] = useState<StrategySpec>(DEFAULT_STRATEGY_SPEC);
  const [manifest, setManifest] = useState<MarketDatasetManifest | null>(null);
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [dataSource, setDataSource] = useState<"static" | "sample">("sample");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [savedEdge, setSavedEdge] = useState(false);
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [testerSpeed, setTesterSpeed] = useState(5);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [initializedRangeKey, setInitializedRangeKey] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiAssumptions, setAiAssumptions] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const [strategySupported, setStrategySupported] = useState(true);
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(null);
  const [missingFeatures, setMissingFeatures] = useState<string[]>([]);

  const selectedSymbol = MARKET_DATA_SYMBOLS.find((item) => item.key === symbol) ?? MARKET_DATA_SYMBOLS[0];
  const selectedManifestItem = useMemo<MarketDatasetManifestItem | null>(
    () =>
      manifest?.datasets.find(
        (item) => item.symbol === symbol && item.timeframe === timeframe,
      ) ?? null,
    [manifest, symbol, timeframe],
  );
  const candleDateBounds = useMemo(() => {
    const first = candles[0]?.time.slice(0, 10) ?? "";
    const last = candles.at(-1)?.time.slice(0, 10) ?? "";
    return { first, last, key: first && last ? `${symbol}:${timeframe}:${first}:${last}` : "" };
  }, [candles, symbol, timeframe]);
  const filteredCandles = useMemo(
    () =>
      candles.filter((candle) => {
        const day = candle.time.slice(0, 10);
        return (!startDate || day >= startDate) && (!endDate || day <= endDate);
      }),
    [candles, endDate, startDate],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadManifest() {
      try {
        const response = await fetch("/market-data/manifest.json", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as MarketDatasetManifest;
        if (!cancelled) setManifest(data);
      } catch {
        if (!cancelled) setManifest(null);
      }
    }
    void loadManifest();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCandles() {
      setIsLoadingData(true);
      setResult(null);
      setSavedEdge(false);
      setAiSummary(null);
      setAiAssumptions([]);
      setParseError(null);
      setParseWarning(null);
      setStrategySupported(true);
      setUnsupportedReason(null);
      setMissingFeatures([]);
      try {
        if (selectedManifestItem) {
          const response = await fetch(selectedManifestItem.path, { cache: "force-cache" });
          if (response.ok) {
            const parsed = parseMarketCandlesCsv(await response.text());
            if (!cancelled && parsed.length > 50) {
              setCandles(parsed);
              setDataSource("static");
              return;
            }
          }
        }
        if (!cancelled) {
          setCandles(buildSampleCandles(symbol, timeframe));
          setDataSource("sample");
        }
      } finally {
        if (!cancelled) setIsLoadingData(false);
      }
    }
    void loadCandles();
    return () => {
      cancelled = true;
    };
  }, [selectedManifestItem, symbol, timeframe]);

  useEffect(() => {
    if (!candleDateBounds.key || initializedRangeKey === candleDateBounds.key) return;
    setStartDate(candleDateBounds.first);
    setEndDate(candleDateBounds.last);
    setInitializedRangeKey(candleDateBounds.key);
  }, [candleDateBounds, initializedRangeKey]);

  const parseWithAi = async () => {
    setIsParsing(true);
    setParseError(null);
    setParseWarning(null);
    setStrategySupported(true);
    setUnsupportedReason(null);
    setMissingFeatures([]);
    setAiSummary(null);
    setAiAssumptions([]);
    try {
      const response = await fetch("/api/backtest/parse-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          symbol: selectedSymbol.label,
          timeframe,
        }),
      });
      const data = (await response.json()) as AiParseResponse;
      if (!response.ok || !data.spec) {
        throw new Error(data.error ?? "AI parser failed");
      }
      setSpec(data.spec);
      setAiSummary(data.summary ?? null);
      setAiAssumptions(data.assumptions ?? []);
      setParseWarning(data.warning ?? null);
      setStrategySupported(data.supported !== false);
      setUnsupportedReason(data.unsupportedReason ?? null);
      setMissingFeatures(data.missingFeatures ?? []);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI parser failed";
      setParseError(message);
      return null;
    } finally {
      setIsParsing(false);
    }
  };

  const handleParse = async () => {
    const data = await parseWithAi();
    if (!data?.spec) return;
    setResult(null);
    setSavedEdge(false);
  };

  const handleCreateCampaign = async () => {
    const data = await parseWithAi();
    if (!data?.spec || data.supported === false) return;
    const backtest = runStrategyBacktest(filteredCandles, data.spec);
    setResult(backtest);
    setSavedEdge(backtest.edgeVerdict === "candidate");
  };

  const selectSampleStrategy = (sample: (typeof SAMPLE_STRATEGIES)[number]) => {
    setSelectedSampleId(sample.id);
    setPrompt(sample.prompt);
    setSpec(parseStrategyPrompt(sample.prompt));
    setResult(null);
    setSavedEdge(false);
    setAiSummary(null);
    setAiAssumptions([]);
    setParseError(null);
    setParseWarning(null);
    setStrategySupported(true);
    setUnsupportedReason(null);
    setMissingFeatures([]);
  };

  const updateSpec = (patch: Partial<StrategySpec>) => {
    setSpec((current) => ({ ...current, ...patch }));
    setResult(null);
    setSavedEdge(false);
    setStrategySupported(true);
    setUnsupportedReason(null);
    setMissingFeatures([]);
  };

  const updateDateRange = (nextStart: string, nextEnd: string) => {
    setStartDate(nextStart);
    setEndDate(nextEnd);
    setResult(null);
    setSavedEdge(false);
  };

  const setRecentRange = (days: number) => {
    if (!candleDateBounds.last) return;
    const end = new Date(`${candleDateBounds.last}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() - days);
    const start = end.toISOString().slice(0, 10);
    updateDateRange(
      start < candleDateBounds.first ? candleDateBounds.first : start,
      candleDateBounds.last,
    );
  };

  const handleRun = () => {
    if (!strategySupported) return;
    const backtest = runStrategyBacktest(filteredCandles, spec);
    setResult(backtest);
    setSavedEdge(backtest.edgeVerdict === "candidate");
  };

  return (
    <div className="min-h-screen bg-deep text-text-primary antialiased">
      <nav className="sticky top-0 z-50 border-b border-border bg-deep/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <BrandLink />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] text-text-muted no-underline transition-colors hover:border-gold/40 hover:text-gold"
            >
              <ArrowLeft size={14} />
              {copy.navHome}
            </Link>
            <ThemeToggle className="h-10 w-10" />
            <LanguageSwitcher className="h-10" />
          </div>
        </div>
      </nav>

      <main
        className="mx-auto grid max-w-none gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[320px_minmax(0,1fr)]"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <section className="grid gap-3 md:grid-cols-4 xl:col-span-2">
          <MetricCard
            label={copy.netReturn}
            value={result ? formatPct(result.netReturnPct) : "-"}
            tone={result && result.netReturnPct > 0 ? "good" : undefined}
          />
          <MetricCard
            label={copy.profitFactor}
            value={result ? formatNumber(result.profitFactor) : "-"}
            tone={result && result.profitFactor >= 1.3 ? "good" : undefined}
          />
          <MetricCard
            label={copy.maxDrawdown}
            value={result ? formatPct(-result.maxDrawdownPct) : "-"}
            tone={result && result.maxDrawdownPct > 25 ? "bad" : undefined}
          />
          <MetricCard
            label={copy.trades}
            value={result ? String(result.totalTrades) : "-"}
            tone={result && result.totalTrades < 30 ? "warn" : undefined}
          />
        </section>

        <aside className="space-y-5 xl:sticky xl:top-20 xl:h-[calc(100vh-96px)] xl:overflow-y-auto">
          <section className="rounded-lg border border-border bg-surface/85 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Database className="h-4 w-4 text-gold" />
              {copy.dataset}
            </div>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2 text-sm text-text-secondary">
                {copy.symbol}
                <select
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value)}
                  className="h-11 rounded-md border border-border bg-card px-3 text-text-primary outline-none transition focus:border-gold/50"
                >
                  {MARKET_DATA_SYMBOLS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-text-secondary">
                {copy.timeframe}
                <select
                  value={timeframe}
                  onChange={(event) => setTimeframe(event.target.value as MarketDataTimeframe)}
                  className="h-11 rounded-md border border-border bg-card px-3 text-text-primary outline-none transition focus:border-gold/50"
                >
                  {MARKET_DATA_TIMEFRAMES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-2 text-sm text-text-secondary">
                  {copy.startDate}
                  <input
                    type="date"
                    value={startDate}
                    min={candleDateBounds.first}
                    max={candleDateBounds.last}
                    onChange={(event) => updateDateRange(event.target.value, endDate)}
                    className="h-11 rounded-md border border-border bg-[#080A0F] px-3 text-[#F5F2EA] outline-none transition focus:border-gold/50"
                    style={{ colorScheme: "dark" }}
                  />
                </label>
                <label className="grid gap-2 text-sm text-text-secondary">
                  {copy.endDate}
                  <input
                    type="date"
                    value={endDate}
                    min={candleDateBounds.first}
                    max={candleDateBounds.last}
                    onChange={(event) => updateDateRange(startDate, event.target.value)}
                    className="h-11 rounded-md border border-border bg-[#080A0F] px-3 text-[#F5F2EA] outline-none transition focus:border-gold/50"
                    style={{ colorScheme: "dark" }}
                  />
                </label>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => updateDateRange(candleDateBounds.first, candleDateBounds.last)}
                  className="h-9 rounded-md border border-border text-xs text-text-secondary transition hover:border-gold/40 hover:text-gold"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setRecentRange(30)}
                  className="h-9 rounded-md border border-border text-xs text-text-secondary transition hover:border-gold/40 hover:text-gold"
                >
                  1M
                </button>
                <button
                  type="button"
                  onClick={() => setRecentRange(90)}
                  className="h-9 rounded-md border border-border text-xs text-text-secondary transition hover:border-gold/40 hover:text-gold"
                >
                  3M
                </button>
                <button
                  type="button"
                  onClick={() => setRecentRange(365)}
                  className="h-9 rounded-md border border-border text-xs text-text-secondary transition hover:border-gold/40 hover:text-gold"
                >
                  1Y
                </button>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-border bg-card/70 p-3">
              <div className="flex items-start gap-3">
                {isLoadingData ? (
                  <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-gold" />
                ) : dataSource === "static" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-gold" />
                )}
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {dataSource === "static" ? copy.cachedData : copy.sampleData}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-text-muted">
                    {filteredCandles.length}/{candles.length} {copy.candlesLoaded} {selectedSymbol.label} / {timeframe}.
                    {dataSource === "sample" && ` ${copy.seedHint}`}
                  </p>
                </div>
              </div>
            </div>
          </section>

        </aside>

        <section className="min-w-0 space-y-5">
          <section className="rounded-lg border border-border bg-surface/85 p-5 lg:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1 text-[12px] uppercase tracking-[0.14em] text-gold">
                  <Sparkles className="h-3.5 w-3.5" />
                  {copy.parserReady}
                </span>
                <h2
                  className="mt-4 text-4xl font-normal leading-tight text-text-primary sm:text-5xl"
                  style={{ fontFamily: SERIF }}
                >
                  {copy.heroTitle}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
                  {copy.heroBody}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleRun()}
                  disabled={isLoadingData || isParsing || filteredCandles.length < 50 || !strategySupported}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-gold-action px-5 text-sm font-semibold text-[#060609] transition hover:bg-gold-actionHover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoadingData || isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {isParsing ? copy.parsing : copy.run}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTesterOpen(true)}
                  disabled={!result}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Maximize2 className="h-4 w-4" />
                  {copy.openTester}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <label className="text-sm font-semibold text-text-primary">
                  {copy.strategyPrompt}
                </label>
                <textarea
                  value={prompt}
                  onChange={(event) => {
                    setSelectedSampleId(null);
                    setPrompt(event.target.value);
                  }}
                  className="mt-3 min-h-[180px] w-full resize-y rounded-lg border border-border bg-[#080A0F] p-4 text-sm leading-6 text-[#F5F2EA] outline-none transition placeholder:text-[#8C93A3] focus:border-gold/60 focus:bg-[#090D14]"
                  placeholder={copy.promptPlaceholder}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCreateCampaign()}
                    disabled={isLoadingData || isParsing || filteredCandles.length < 50 || prompt.trim().length < 8}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-gold-action px-3 text-sm font-semibold text-[#060609] transition hover:bg-gold-actionHover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    {isParsing ? copy.parsing : copy.createCampaign}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleParse()}
                    disabled={isParsing || prompt.trim().length < 8}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm text-text-secondary transition hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                    {isParsing ? copy.parsing : copy.parseRules}
                  </button>
                </div>

                <div className="mt-5">
                  <p className="text-[12px] uppercase tracking-[0.14em] text-text-muted">
                    {copy.sampleStrategies}
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {SAMPLE_STRATEGIES.map((sample) => (
                      <button
                        type="button"
                        key={sample.id}
                        onClick={() => selectSampleStrategy(sample)}
                        className={cn(
                          "min-h-[86px] rounded-lg border p-3 text-left transition hover:border-gold/45 hover:bg-gold/5",
                          selectedSampleId === sample.id
                            ? "border-gold/55 bg-gold/10"
                            : "border-border bg-deep/35",
                        )}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="text-sm font-semibold text-text-primary">
                            {sample.name}
                          </span>
                          <span className="rounded-md border border-border px-2 py-0.5 text-[11px] uppercase tracking-[0.08em] text-text-muted">
                            {sample.badge}
                          </span>
                        </span>
                        <span className="mt-2 block text-xs leading-5 text-text-muted">
                          {sample.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <section className="rounded-lg border border-border bg-card/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.14em] text-text-muted">
                      {copy.parsedSpec}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-text-primary">
                      {describeSpec(spec)}
                    </h3>
                  </div>
                  <Bot className="h-5 w-5 text-gold" />
                </div>
                <div className="mt-4 grid gap-2">
                  <label className="grid gap-1.5 rounded-lg border border-border bg-deep/35 px-3 py-2">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
                      Template
                    </span>
                    <select
                      value={spec.template}
                      onChange={(event) => updateSpec({ template: event.target.value as StrategySpec["template"] })}
                      className="h-9 rounded-md border border-border bg-[#080A0F] px-2 text-sm font-semibold text-[#F5F2EA] outline-none transition focus:border-gold/60"
                    >
                      <option value="ema-cross">EMA crossover</option>
                      <option value="rsi-reversion">RSI reversion</option>
                      <option value="breakout">Breakout</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5 rounded-lg border border-border bg-deep/35 px-3 py-2">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
                      {copy.direction}
                    </span>
                    <select
                      value={spec.direction}
                      onChange={(event) => updateSpec({ direction: event.target.value as StrategySpec["direction"] })}
                      className="h-9 rounded-md border border-border bg-[#080A0F] px-2 text-sm font-semibold text-[#F5F2EA] outline-none transition focus:border-gold/60"
                    >
                      <option value="both">Both</option>
                      <option value="long">Long only</option>
                      <option value="short">Short only</option>
                    </select>
                  </label>

                  {spec.template === "ema-cross" && (
                    <div className="grid grid-cols-2 gap-2">
                      <SpecInput
                        label="Fast EMA"
                        value={spec.fastEma}
                        min={2}
                        max={100}
                        onChange={(value) =>
                          updateSpec({
                            fastEma: Math.round(value),
                            slowEma: Math.max(spec.slowEma, Math.round(value) + 1),
                          })
                        }
                      />
                      <SpecInput
                        label="Slow EMA"
                        value={spec.slowEma}
                        min={spec.fastEma + 1}
                        max={300}
                        onChange={(value) => updateSpec({ slowEma: Math.round(value) })}
                      />
                    </div>
                  )}

                  {spec.template === "rsi-reversion" && (
                    <div className="grid grid-cols-3 gap-2">
                      <SpecInput
                        label="RSI"
                        value={spec.rsiPeriod}
                        min={2}
                        max={50}
                        onChange={(value) => updateSpec({ rsiPeriod: Math.round(value) })}
                      />
                      <SpecInput
                        label="Buy <"
                        value={spec.rsiBuyBelow}
                        min={10}
                        max={50}
                        onChange={(value) => updateSpec({ rsiBuyBelow: value })}
                      />
                      <SpecInput
                        label="Sell >"
                        value={spec.rsiSellAbove}
                        min={50}
                        max={90}
                        onChange={(value) => updateSpec({ rsiSellAbove: value })}
                      />
                    </div>
                  )}

                  {spec.template === "breakout" && (
                    <SpecInput
                      label="Lookback"
                      value={spec.breakoutLookback}
                      min={5}
                      max={200}
                      onChange={(value) => updateSpec({ breakoutLookback: Math.round(value) })}
                    />
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <SpecInput
                      label={copy.risk}
                      value={spec.riskPct}
                      min={0.1}
                      max={5}
                      step={0.1}
                      suffix="%"
                      onChange={(value) => updateSpec({ riskPct: value })}
                    />
                    <SpecInput
                      label={copy.stop}
                      value={spec.stopAtr}
                      min={0.3}
                      max={8}
                      step={0.1}
                      suffix="ATR"
                      onChange={(value) => updateSpec({ stopAtr: value })}
                    />
                    <SpecInput
                      label={copy.target}
                      value={spec.targetAtr}
                      min={0.5}
                      max={16}
                      step={0.1}
                      suffix="ATR"
                      onChange={(value) => updateSpec({ targetAtr: value })}
                    />
                  </div>
                </div>
                {!strategySupported && (
                  <div className="mt-4 rounded-md border border-red/35 bg-red/10 p-3 text-xs leading-5 text-red">
                    <p className="font-semibold text-red">
                      Chưa thể backtest chính xác với engine hiện tại.
                    </p>
                    {unsupportedReason && <p className="mt-1">{unsupportedReason}</p>}
                    {missingFeatures.length > 0 && (
                      <p className="mt-1 text-text-muted">
                        Cần thêm: {missingFeatures.join(" · ")}
                      </p>
                    )}
                    <p className="mt-1 text-text-muted">
                      Có thể chỉnh thủ công sang EMA, RSI hoặc Breakout nếu bạn muốn chạy bản xấp xỉ.
                    </p>
                  </div>
                )}
                {(aiSummary || aiAssumptions.length > 0 || parseError || parseWarning) && (
                  <div className="mt-4 rounded-md border border-border bg-deep/35 p-3 text-xs leading-5 text-text-muted">
                    {parseError ? (
                      <p className="text-red">{copy.aiError}: {parseError}</p>
                    ) : (
                      <>
                        {parseWarning && <p className="text-gold">{parseWarning}</p>}
                        {aiSummary && <p className="text-text-secondary">{aiSummary}</p>}
                        {aiAssumptions.length > 0 && (
                          <p className="mt-1">{aiAssumptions.join(" · ")}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </section>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <EquityChart result={result} copy={copy} />

            <section className="rounded-lg border border-border bg-surface/85 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.14em] text-text-muted">
                    {copy.edgeDetector}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-text-primary">
                    {result ? `${result.edgeScore}/100` : copy.waitingRun}
                  </h2>
                </div>
                <Gauge className="h-5 w-5 text-gold" />
              </div>

              <div
                className={cn(
                  "mt-5 rounded-lg border p-4",
                  result?.edgeVerdict === "candidate"
                    ? "border-green/30 bg-green/10"
                    : result?.edgeVerdict === "weak"
                      ? "border-red/30 bg-red/10"
                      : "border-gold/25 bg-gold/8",
                )}
              >
                <div className="flex items-start gap-3">
                  {result?.edgeVerdict === "candidate" ? (
                    <BellRing className="mt-0.5 h-5 w-5 text-green" />
                  ) : result?.edgeVerdict === "weak" ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-red" />
                  ) : (
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-gold" />
                  )}
                  <div>
                    <p className="font-semibold text-text-primary">
                      {result?.edgeVerdict === "candidate"
                        ? copy.edgeSaved
                        : result?.edgeVerdict === "weak"
                          ? copy.noEdge
                          : copy.needsTrades}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-text-muted">
                      {result?.edgeVerdict === "candidate"
                        ? copy.edgeSavedBody
                        : copy.edgeDefaultBody}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">{copy.winRate}</span>
                  <span className="font-mono text-text-primary">
                    {result ? formatPct(result.winRatePct) : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">{copy.expectancy}</span>
                  <span className="font-mono text-text-primary">
                    {result ? `${result.expectancyR.toFixed(2)}R` : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">{copy.adminAlert}</span>
                  <span className={cn("font-mono", savedEdge ? "text-green" : "text-text-muted")}>
                    {savedEdge ? copy.queued : copy.off}
                  </span>
                </div>
              </div>
            </section>
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-surface/85">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="text-[12px] uppercase tracking-[0.14em] text-text-muted">
                  {copy.tradeLedger}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-text-primary">
                  {copy.tradeLedgerTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => void handleRun()}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm text-text-secondary transition hover:border-gold/40 hover:text-gold"
              >
                <RefreshCw className="h-4 w-4" />
                {copy.rerun}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-border text-[12px] uppercase tracking-[0.12em] text-text-muted">
                  <tr>
                    {copy.ledgerHeaders.map((header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(result?.trades.slice(-12).reverse() ?? []).map((trade) => (
                    <tr key={trade.id} className="border-b border-border/65">
                      <td className="px-4 py-4 font-mono text-text-muted">{trade.id}</td>
                      <td className="px-4 py-4 capitalize text-text-primary">{trade.direction}</td>
                      <td className="px-4 py-4">
                        <p className="font-mono text-text-primary">{trade.entry.toFixed(5)}</p>
                        <p className="text-xs text-text-muted">{trade.entryTime.slice(0, 16).replace("T", " ")}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-mono text-text-primary">{trade.exit.toFixed(5)}</p>
                        <p className="text-xs text-text-muted">{trade.exitTime.slice(0, 16).replace("T", " ")}</p>
                      </td>
                      <td className={cn("px-4 py-4 font-mono", trade.pnlPct >= 0 ? "text-green" : "text-red")}>
                        {formatPct(trade.pnlPct)}
                      </td>
                      <td className={cn("px-4 py-4 font-mono", trade.rMultiple >= 0 ? "text-green" : "text-red")}>
                        {trade.rMultiple.toFixed(2)}R
                      </td>
                      <td className="px-4 py-4 capitalize text-text-secondary">{trade.reason}</td>
                    </tr>
                  ))}
                  {!result && (
                    <tr>
                      <td className="px-4 py-8 text-center text-text-muted" colSpan={7}>
                        {copy.ledgerEmpty}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
      <StrategyTesterModal
        open={isTesterOpen}
        onClose={() => setIsTesterOpen(false)}
        candles={filteredCandles}
        result={result}
        speed={testerSpeed}
        setSpeed={setTesterSpeed}
        symbolLabel={selectedSymbol.label}
        timeframe={timeframe}
        copy={copy.tester}
      />
    </div>
  );
}

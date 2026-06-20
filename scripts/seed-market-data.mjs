import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_ROOT = path.join(ROOT, "public", "market-data");
const DUKASCOPY_ROOT = path.join(ROOT, "data", "vendor", "dukascopy");
const TWELVE_DATA_URL = "https://api.twelvedata.com/time_series";

const symbols = [
  { key: "xauusd", label: "XAU/USD", twelveDataSymbol: "XAU/USD", dukascopySymbol: "XAUUSD" },
  { key: "eurusd", label: "EUR/USD", twelveDataSymbol: "EUR/USD", dukascopySymbol: "EURUSD" },
  { key: "gbpusd", label: "GBP/USD", twelveDataSymbol: "GBP/USD", dukascopySymbol: "GBPUSD" },
  { key: "audusd", label: "AUD/USD", twelveDataSymbol: "AUD/USD", dukascopySymbol: "AUDUSD" },
  { key: "nzdusd", label: "NZD/USD", twelveDataSymbol: "NZD/USD", dukascopySymbol: "NZDUSD" },
  { key: "usdcad", label: "USD/CAD", twelveDataSymbol: "USD/CAD", dukascopySymbol: "USDCAD" },
  { key: "usdchf", label: "USD/CHF", twelveDataSymbol: "USD/CHF", dukascopySymbol: "USDCHF" },
  { key: "usdjpy", label: "USD/JPY", twelveDataSymbol: "USD/JPY", dukascopySymbol: "USDJPY" },
  { key: "xagusd", label: "XAG/USD", twelveDataSymbol: "XAG/USD", dukascopySymbol: "XAGUSD" },
  { key: "usoil", label: "US Oil", twelveDataSymbol: "WTI/USD", dukascopySymbol: "USOIL" },
];

const timeframes = ["5min", "15min", "1h", "4h", "1day"];
const defaultOutputSize = {
  "5min": "5000",
  "15min": "5000",
  "1h": "5000",
  "4h": "5000",
  "1day": "5000",
};

function sampleBase(symbolKey) {
  if (symbolKey === "usdjpy") return 155;
  if (symbolKey === "xauusd") return 2340;
  if (symbolKey === "xagusd") return 29;
  if (symbolKey === "usoil") return 78;
  if (symbolKey === "usdcad") return 1.36;
  if (symbolKey === "usdchf") return 0.9;
  if (symbolKey === "gbpusd") return 1.27;
  if (symbolKey === "audusd") return 0.66;
  if (symbolKey === "nzdusd") return 0.61;
  return 1.08;
}

function sampleStepMs(timeframe) {
  if (timeframe === "1day") return 86_400_000;
  if (timeframe === "4h") return 14_400_000;
  if (timeframe === "1h") return 3_600_000;
  if (timeframe === "15min") return 900_000;
  return 300_000;
}

function buildSampleCandles(symbolKey, timeframe, count = 1500) {
  const base = sampleBase(symbolKey);
  const stepMs = sampleStepMs(timeframe);
  const start = Date.now() - count * stepMs;
  let close = base;
  let seed = Array.from(`${symbolKey}:${timeframe}`).reduce((sum, char) => sum + char.charCodeAt(0), 17);
  const nextRandom = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const randomSigned = () => nextRandom() * 2 - 1;
  const precision = ["usdjpy", "xauusd", "xagusd", "usoil"].includes(symbolKey) ? 2 : 5;
  const pipSize = symbolKey === "usdjpy" ? 0.01 : ["xauusd", "xagusd", "usoil"].includes(symbolKey) ? 0.1 : 0.0001;
  const baseVolatility =
    timeframe === "1day"
      ? 0.0075
      : timeframe === "4h"
        ? 0.0042
        : timeframe === "1h"
          ? 0.0024
          : timeframe === "15min"
            ? 0.00135
            : 0.0008;

  return Array.from({ length: count }, (_, index) => {
    const sessionPulse = 0.75 + Math.abs(Math.sin(index / 19)) * 0.7;
    const volatilityCluster = 0.75 + Math.abs(Math.sin(index / 53 + randomSigned())) * 0.8;
    const drift = Math.sin(index / 97) * base * baseVolatility * 0.1;
    const shock =
      (randomSigned() + randomSigned() * 0.55 + randomSigned() * 0.25) *
      base *
      baseVolatility *
      sessionPulse *
      volatilityCluster;
    const gap = randomSigned() * base * baseVolatility * 0.12;
    const open = Math.max(base * 0.5, close + gap);
    close = Math.max(base * 0.5, open + shock + drift);
    const body = Math.abs(close - open);
    const wickBase = Math.max(body * (0.35 + nextRandom() * 1.8), base * baseVolatility * 0.22);
    const high = Math.max(open, close) + wickBase * (0.35 + nextRandom() * 1.15);
    const low = Math.max(pipSize, Math.min(open, close) - wickBase * (0.35 + nextRandom() * 1.15));

    return {
      time: new Date(start + index * stepMs).toISOString().replace(".000Z", "Z"),
      open: Number(open.toFixed(precision)),
      high: Number(high.toFixed(precision)),
      low: Number(low.toFixed(precision)),
      close: Number(close.toFixed(precision)),
      volume: 850 + Math.round((body / Math.max(base * baseVolatility, pipSize)) * 420 + nextRandom() * 900),
      spread: symbolKey === "xauusd" ? 24 : symbolKey === "xagusd" ? 18 : symbolKey === "usoil" ? 5 : 2,
    };
  });
}

async function loadEnvFiles() {
  for (const filename of [".env.local", ".env", ".env.example"]) {
    try {
      const text = await fs.readFile(path.join(ROOT, filename), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const separator = trimmed.indexOf("=");
        if (separator <= 0) continue;
        const key = trimmed.slice(0, separator).trim();
        const rawValue = trimmed.slice(separator + 1).trim();
        if (process.env[key] !== undefined) continue;
        process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
      }
    } catch (error) {
      if (!error || error.code !== "ENOENT") throw error;
    }
  }
}

function parseArgs(argv) {
  const options = {
    provider: "both",
    symbols: symbols.map((symbol) => symbol.key),
    timeframes,
    outputsize: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === "--provider" && value) {
      options.provider = value;
      index += 1;
    } else if (arg === "--symbols" && value) {
      options.symbols = value.split(",").map((item) => item.trim()).filter(Boolean);
      index += 1;
    } else if (arg === "--timeframes" && value) {
      options.timeframes = value.split(",").map((item) => item.trim()).filter(Boolean);
      index += 1;
    } else if (arg === "--outputsize" && value) {
      options.outputsize = value;
      index += 1;
    }
  }

  return options;
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function cleanHeader(value) {
  return value.trim().toLowerCase().replace(/^<|>$/g, "");
}

function normalizeTime(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00Z`;
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const normalized = trimmed.replace(" ", "T");
    return `${normalized.length === 16 ? `${normalized}:00` : normalized}Z`;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().replace(".000Z", "Z");
}

function parseNumber(value) {
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCandlesCsv(input) {
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map(cleanHeader);
  const indexes = {
    time: headers.findIndex((header) => ["time", "datetime", "date"].includes(header)),
    open: headers.indexOf("open"),
    high: headers.indexOf("high"),
    low: headers.indexOf("low"),
    close: headers.indexOf("close"),
    volume: headers.findIndex((header) => ["volume", "tickvol", "tick_volume", "vol"].includes(header)),
    spread: headers.indexOf("spread"),
  };
  if (indexes.time < 0 || indexes.open < 0 || indexes.high < 0 || indexes.low < 0 || indexes.close < 0) {
    throw new Error("CSV must include time/datetime/date, open, high, low, close columns");
  }

  return lines.slice(1).flatMap((line) => {
    const cells = splitCsvLine(line);
    const candle = {
      time: normalizeTime(cells[indexes.time]),
      open: parseNumber(cells[indexes.open]),
      high: parseNumber(cells[indexes.high]),
      low: parseNumber(cells[indexes.low]),
      close: parseNumber(cells[indexes.close]),
      volume: indexes.volume >= 0 ? parseNumber(cells[indexes.volume]) : null,
      spread: indexes.spread >= 0 ? parseNumber(cells[indexes.spread]) : null,
    };
    if (!candle.time || candle.open === null || candle.high === null || candle.low === null || candle.close === null) {
      return [];
    }
    if (candle.high < candle.low) return [];
    return [candle];
  }).sort((a, b) => a.time.localeCompare(b.time));
}

function candlesToCsv(candles) {
  const rows = candles.map((candle) => [
    candle.time,
    candle.open,
    candle.high,
    candle.low,
    candle.close,
    candle.volume ?? "",
    candle.spread ?? "",
  ].join(","));
  return `time,open,high,low,close,volume,spread\n${rows.join("\n")}\n`;
}

function mergeCandles(...sets) {
  const byTime = new Map();
  for (const set of sets) {
    for (const candle of set) byTime.set(candle.time, candle);
  }
  return [...byTime.values()].sort((a, b) => a.time.localeCompare(b.time));
}

async function readExisting(symbolKey, timeframe) {
  const file = path.join(OUT_ROOT, symbolKey, `${timeframe}.csv`);
  try {
    return parseCandlesCsv(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeDataset(symbolKey, timeframe, provider, candles, manifestItems) {
  const dir = path.join(OUT_ROOT, symbolKey);
  const file = path.join(dir, `${timeframe}.csv`);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, candlesToCsv(candles), "utf8");
  manifestItems.push({
    symbol: symbolKey,
    timeframe,
    provider,
    path: `/market-data/${symbolKey}/${timeframe}.csv`,
    candles: candles.length,
    firstTime: candles[0]?.time ?? null,
    lastTime: candles.at(-1)?.time ?? null,
    generatedAt: new Date().toISOString(),
  });
}

async function fetchTwelveData(symbol, timeframe, outputsize) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) throw new Error("TWELVE_DATA_API_KEY is not set");
  const params = new URLSearchParams({
    symbol: symbol.twelveDataSymbol,
    interval: timeframe,
    outputsize: outputsize ?? defaultOutputSize[timeframe] ?? "5000",
    order: "asc",
    apikey: apiKey,
  });
  const response = await fetch(`${TWELVE_DATA_URL}?${params}`);
  if (!response.ok) throw new Error(`Twelve Data returned ${response.status}`);
  const data = await response.json();
  if (data.status === "error") throw new Error(data.message ?? "Twelve Data error");
  return (data.values ?? []).flatMap((value) => {
    const candle = {
      time: normalizeTime(value.datetime),
      open: parseNumber(value.open),
      high: parseNumber(value.high),
      low: parseNumber(value.low),
      close: parseNumber(value.close),
      volume: parseNumber(value.volume),
      spread: null,
    };
    if (!candle.time || candle.open === null || candle.high === null || candle.low === null || candle.close === null) {
      return [];
    }
    return [candle];
  }).sort((a, b) => a.time.localeCompare(b.time));
}

async function readDukascopyCsv(symbol, timeframe) {
  const candidates = [
    path.join(DUKASCOPY_ROOT, symbol.dukascopySymbol, `${timeframe}.csv`),
    path.join(DUKASCOPY_ROOT, `${symbol.dukascopySymbol}_${timeframe}.csv`),
  ];
  for (const file of candidates) {
    try {
      return parseCandlesCsv(await fs.readFile(file, "utf8"));
    } catch (error) {
      if (!error || error.code !== "ENOENT") throw error;
    }
  }
  return [];
}

async function main() {
  await loadEnvFiles();
  const options = parseArgs(process.argv.slice(2));
  const selectedSymbols = options.symbols.map((key) => {
    const symbol = symbols.find((entry) => entry.key === key);
    if (!symbol) throw new Error(`Unknown symbol: ${key}`);
    return symbol;
  });
  const manifestItems = [];

  for (const symbol of selectedSymbols) {
    for (const timeframe of options.timeframes) {
      const existing = await readExisting(symbol.key, timeframe);
      let provider = "static-cache";
      let candles = existing;

      if (options.provider === "both" || options.provider === "dukascopy") {
        const dukascopy = await readDukascopyCsv(symbol, timeframe);
        if (dukascopy.length > 0) {
          candles = mergeCandles(candles, dukascopy);
          provider = "dukascopy-csv";
        }
      }

      if (options.provider === "sample") {
        candles = buildSampleCandles(symbol.key, timeframe);
        provider = "static-cache";
      }

      if (options.provider === "both" || options.provider === "twelve-data") {
        const twelve = await fetchTwelveData(symbol, timeframe, options.outputsize);
        candles = mergeCandles(candles, twelve);
        provider = provider === "dukascopy-csv" ? "twelve-data" : "twelve-data";
      }

      if (candles.length === 0) {
        console.warn(`Skipped ${symbol.key} ${timeframe}: no candles`);
        continue;
      }

      await writeDataset(symbol.key, timeframe, provider, candles, manifestItems);
      console.log(`Wrote ${symbol.key} ${timeframe}: ${candles.length} candles (${provider})`);
    }
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    datasets: manifestItems,
  };
  await fs.mkdir(OUT_ROOT, { recursive: true });
  await fs.writeFile(
    path.join(OUT_ROOT, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

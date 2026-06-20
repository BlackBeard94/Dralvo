import type { MarketCandle } from "./types";

const CSV_HEADER = "time,open,high,low,close,volume,spread";

function cleanHeader(value: string) {
  return value.trim().toLowerCase().replace(/^<|>$/g, "");
}

function parseNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function toIsoSeconds(date: Date) {
  return date.toISOString().replace(".000Z", "Z");
}

function normalizeTime(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00Z`;
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const withSeconds = trimmed.includes(":")
      ? trimmed.replace(" ", "T")
      : `${trimmed.replace(" ", "T")}:00`;
    const normalized = withSeconds.length === 16 ? `${withSeconds}:00` : withSeconds;
    return `${normalized}Z`;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return toIsoSeconds(date);
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
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

export function candlesToCsv(candles: MarketCandle[]) {
  const lines = candles.map((candle) =>
    [
      candle.time,
      candle.open,
      candle.high,
      candle.low,
      candle.close,
      candle.volume ?? "",
      candle.spread ?? "",
    ].join(","),
  );
  return `${CSV_HEADER}\n${lines.join("\n")}\n`;
}

export function parseMarketCandlesCsv(input: string): MarketCandle[] {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map(cleanHeader);
  const indexes = {
    time: headers.findIndex((header) =>
      ["time", "datetime", "date"].includes(header),
    ),
    open: headers.indexOf("open"),
    high: headers.indexOf("high"),
    low: headers.indexOf("low"),
    close: headers.indexOf("close"),
    volume: headers.findIndex((header) =>
      ["volume", "tickvol", "tick_volume", "vol"].includes(header),
    ),
    spread: headers.indexOf("spread"),
  };

  if (
    indexes.time < 0 ||
    indexes.open < 0 ||
    indexes.high < 0 ||
    indexes.low < 0 ||
    indexes.close < 0
  ) {
    throw new Error(
      "CSV must include time/datetime/date, open, high, low, close columns",
    );
  }

  return lines
    .slice(1)
    .map((line) => {
      const cells = splitCsvLine(line);
      const time = normalizeTime(cells[indexes.time]);
      const open = parseNumber(cells[indexes.open]);
      const high = parseNumber(cells[indexes.high]);
      const low = parseNumber(cells[indexes.low]);
      const close = parseNumber(cells[indexes.close]);
      if (
        !time ||
        open === null ||
        high === null ||
        low === null ||
        close === null ||
        high < low
      ) {
        return null;
      }
      return {
        time,
        open,
        high,
        low,
        close,
        volume: indexes.volume >= 0 ? parseNumber(cells[indexes.volume]) : null,
        spread: indexes.spread >= 0 ? parseNumber(cells[indexes.spread]) : null,
      };
    })
    .filter((candle): candle is MarketCandle => candle !== null)
    .sort((a, b) => a.time.localeCompare(b.time));
}

import { DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import type { IndicatorSnapshot } from "@/data/indicators";
import type { EvidenceObservation, IngestionResult } from "@/data/ingestion/types";
import { formatObservedLabel } from "@/data/ingestion/types";
import { rateLimitedTwelveDataFetch } from "@/data/ingestion/twelve-data-limiter";

const TWELVE_DATA_TIME_SERIES_URL = "https://api.twelvedata.com/time_series";
const XAUUSD_HISTORY_MIN_YEAR = 2000;
const XAUUSD_DRIVER = DRIVER_SOURCE_REGISTRY.find(
  (driver) => driver.driverKey === "xauusd-price-context",
);

type TwelveDataValue = {
  datetime: string;
  close: string;
};

type TwelveDataResponse = {
  values?: TwelveDataValue[];
  status?: string;
  message?: string;
};

export type XauusdCloseObservation = {
  date: string;
  close: number;
};

export type XauusdDailyReport = {
  latestDate: string;
  previousDate: string;
  price: number;
  previousClose: number;
  changePercent: number;
};

function determineStatus(changePercent: number): IndicatorSnapshot["status"] {
  if (changePercent > 0.3) return "bullish";
  if (changePercent < -0.3) return "bearish";
  return "neutral";
}

function buildSummary(report: XauusdDailyReport): string {
  const direction = report.changePercent > 0
    ? "up"
    : report.changePercent < 0
      ? "down"
      : "unchanged";
  return (
    `XAUUSD was $${report.price.toFixed(2)} on the latest Twelve Data daily bar, ` +
    `${direction} ${Math.abs(report.changePercent).toFixed(2)}% versus ${report.previousDate}. ` +
    "Price direction is market context and is not presented as a standalone recommendation."
  );
}

export function parseXauusdDailyResponse(
  data: TwelveDataResponse,
): XauusdDailyReport {
  if (data.status === "error") {
    throw new Error(data.message ?? "Twelve Data error");
  }

  const valid = parseXauusdCloseObservations(data);

  if (valid.length < 2) {
    throw new Error("Twelve Data did not return two valid XAU/USD closes");
  }

  const [latest, previous] = valid;
  return {
    latestDate: latest.date,
    previousDate: previous.date,
    price: latest.close,
    previousClose: previous.close,
    changePercent: ((latest.close - previous.close) / previous.close) * 100,
  };
}

export function parseXauusdCloseObservations(
  data: TwelveDataResponse,
): XauusdCloseObservation[] {
  if (data.status === "error") {
    throw new Error(data.message ?? "Twelve Data error");
  }

  return (data.values ?? [])
    .map((value) => ({
      date: value.datetime.slice(0, 10),
      close: Number(value.close),
    }))
    .filter(
      (value) =>
        /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
        Number.isFinite(value.close) &&
        value.close > 0,
    );
}

export function validateXauusdHistoricalYear(
  value: unknown,
  currentYear = new Date().getUTCFullYear(),
) {
  const year = typeof value === "number" ? value : Number(value);
  if (
    !Number.isInteger(year) ||
    year < XAUUSD_HISTORY_MIN_YEAR ||
    year > currentYear
  ) {
    return null;
  }
  return year;
}

export function buildXauusdHistoricalUrl(year: number, apiKey: string) {
  const validatedYear = validateXauusdHistoricalYear(year);
  if (!validatedYear) throw new Error(`Invalid XAUUSD historical year: ${year}`);

  const params = new URLSearchParams({
    symbol: "XAU/USD",
    interval: "1day",
    start_date: `${validatedYear - 1}-12-01`,
    end_date: `${validatedYear}-12-31`,
    outputsize: "5000",
    order: "asc",
    apikey: apiKey,
  });
  return `${TWELVE_DATA_TIME_SERIES_URL}?${params}`;
}

export function buildXauusdHistoricalObservations(
  data: TwelveDataResponse,
  year: number,
): EvidenceObservation[] {
  const validatedYear = validateXauusdHistoricalYear(year);
  if (!validatedYear) throw new Error(`Invalid XAUUSD historical year: ${year}`);

  const values = parseXauusdCloseObservations(data).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  if (values.length < 2) {
    throw new Error("Twelve Data did not return enough XAU/USD history");
  }

  return values.flatMap((entry, index) => {
    if (Number(entry.date.slice(0, 4)) !== validatedYear) return [];
    const previous = values[index - 1];
    const metadata = {
      symbol: "XAU/USD",
      interval: "1day",
      historicalArchiveYear: validatedYear,
      methodologyVersion:
        XAUUSD_DRIVER?.methodologyVersion ?? "xauusd-price-context.v1",
    };
    const direct: EvidenceObservation = {
      sourceKey: "twelve-data",
      driverKey: "xauusd-price-context",
      seriesKey: "xauusd_close_usd",
      numericValue: entry.close,
      unit: "usd_per_troy_ounce",
      observedAt: `${entry.date}T00:00:00Z`,
      releasedAt: null,
      sourceUrl: "https://twelvedata.com/docs",
      quality: "delayed",
      metadata,
    };
    if (!previous) return [direct];

    return [
      direct,
      {
        ...direct,
        seriesKey: "xauusd_daily_change_percent",
        numericValue: ((entry.close - previous.close) / previous.close) * 100,
        unit: "percent",
        metadata: {
          ...metadata,
          previousObservationDate: previous.date,
        },
      },
    ];
  });
}

function buildObservations(report: XauusdDailyReport): EvidenceObservation[] {
  const common = {
    sourceKey: "twelve-data",
    driverKey: "xauusd-price-context",
    observedAt: `${report.latestDate}T00:00:00Z`,
    releasedAt: null,
    sourceUrl: "https://twelvedata.com/docs",
    quality: "delayed" as const,
    metadata: {
      symbol: "XAU/USD",
      interval: "1day",
      previousObservationDate: report.previousDate,
      methodologyVersion:
        XAUUSD_DRIVER?.methodologyVersion ?? "xauusd-price-context.v1",
    },
  };

  return [
    {
      ...common,
      seriesKey: "xauusd_close_usd",
      numericValue: report.price,
      unit: "usd_per_troy_ounce",
    },
    {
      ...common,
      seriesKey: "xauusd_daily_change_percent",
      numericValue: report.changePercent,
      unit: "percent",
    },
  ];
}

export async function fetchXauusdSpot(
  fetchFn: (url: string) => Promise<Response> = rateLimitedTwelveDataFetch,
): Promise<IngestionResult> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return {
      key: "xauusd-spot",
      status: "error",
      error: "TWELVE_DATA_API_KEY not set",
    };
  }

  try {
    const url =
      `${TWELVE_DATA_TIME_SERIES_URL}?symbol=${encodeURIComponent("XAU/USD")}` +
      `&interval=1day&outputsize=2&apikey=${apiKey}`;
    const response = await fetchFn(url);
    if (!response.ok) {
      throw new Error(`Twelve Data returned ${response.status}`);
    }

    const report = parseXauusdDailyResponse(
      (await response.json()) as TwelveDataResponse,
    );
    const now = new Date();
    const snapshot: IndicatorSnapshot = {
      key: "xauusd-spot",
      name: "XAUUSD Price Context",
      source: "Twelve Data",
      cadence: "Hourly ingestion",
      value: `$${report.price.toFixed(2)}`,
      change:
        `${report.changePercent >= 0 ? "+" : ""}${report.changePercent.toFixed(2)}%`,
      status: determineStatus(report.changePercent),
      summary: buildSummary(report),
      observedAt: now.toISOString(),
      observedLabel: formatObservedLabel(now),
      dataQuality: "delayed",
      qualityNote:
        `Latest daily close dated ${report.latestDate}; change is calculated from the prior valid daily close.`,
      sparkline: [report.previousClose, report.price],
    };

    return {
      key: snapshot.key,
      status: "success",
      data: snapshot,
      observations: buildObservations(report),
    };
  } catch (error) {
    return {
      key: "xauusd-spot",
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export { TWELVE_DATA_TIME_SERIES_URL, XAUUSD_HISTORY_MIN_YEAR };

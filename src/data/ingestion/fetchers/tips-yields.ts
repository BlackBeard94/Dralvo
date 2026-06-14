import { DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import type { IndicatorSnapshot } from "@/data/indicators";
import type { EvidenceObservation, IngestionResult } from "@/data/ingestion/types";
import { formatObservedLabel } from "@/data/ingestion/types";

const FRED_DFII10_URL =
  "https://api.stlouisfed.org/fred/series/observations?series_id=DFII10&file_type=json&limit=10&sort_order=desc";
const FRED_DFII10_SOURCE_URL = "https://fred.stlouisfed.org/series/DFII10";
const FRED_DFII10_MIN_YEAR = 2003;
const TIPS_DRIVER = DRIVER_SOURCE_REGISTRY.find(
  (driver) => driver.driverKey === "tips-real-yield",
);

type FredObservation = {
  date: string;
  value: string;
};

type FredResponse = {
  observations?: FredObservation[];
  error_message?: string;
};

export type FredTipsObservation = {
  date: string;
  value: number;
};

export type TipsYieldReport = {
  latestDate: string;
  previousDate: string;
  yieldPercent: number;
  previousYieldPercent: number;
  changeBps: number;
};

function determineStatus(yieldPercent: number): IndicatorSnapshot["status"] {
  if (yieldPercent < 1.7) return "bullish";
  if (yieldPercent > 2.0) return "bearish";
  return "neutral";
}

function buildSummary(yieldPercent: number, changeBps: number): string {
  const direction = changeBps > 0 ? "rose" : changeBps < 0 ? "fell" : "was unchanged";
  return (
    `The US 10-year real yield was ${yieldPercent.toFixed(2)}%, and ${direction} ` +
    `${Math.abs(changeBps).toFixed(0)} bps from the previous valid FRED observation. ` +
    "Lower real yields generally reduce the opportunity cost of holding gold; this relationship is context, not a standalone trade signal."
  );
}

export function parseFredTipsResponse(data: FredResponse): TipsYieldReport {
  const valid = parseFredTipsObservations(data);

  if (valid.length < 2) {
    throw new Error(
      data.error_message ?? "FRED DFII10 did not return two valid observations",
    );
  }

  const [latest, previous] = valid;
  return {
    latestDate: latest.date,
    previousDate: previous.date,
    yieldPercent: latest.value,
    previousYieldPercent: previous.value,
    changeBps: Math.round((latest.value - previous.value) * 100),
  };
}

export function parseFredTipsObservations(
  data: FredResponse,
): FredTipsObservation[] {
  return (data.observations ?? [])
    .map((observation) => ({
      date: observation.date,
      value: Number(observation.value),
    }))
    .filter(
      (observation) =>
        /^\d{4}-\d{2}-\d{2}$/.test(observation.date) &&
        Number.isFinite(observation.value),
    );
}

function buildObservations(report: TipsYieldReport): EvidenceObservation[] {
  const common = {
    sourceKey: "fred-dfii10",
    driverKey: "tips-real-yield",
    observedAt: `${report.latestDate}T00:00:00Z`,
    releasedAt: null,
    sourceUrl: FRED_DFII10_SOURCE_URL,
    quality: "delayed" as const,
    metadata: {
      seriesId: "DFII10",
      previousObservationDate: report.previousDate,
      methodologyVersion:
        TIPS_DRIVER?.methodologyVersion ?? "tips-real-yield.v1",
    },
  };

  return [
    {
      ...common,
      seriesKey: "dfii10_yield_percent",
      numericValue: report.yieldPercent,
      unit: "percent",
    },
    {
      ...common,
      seriesKey: "dfii10_change_bps",
      numericValue: report.changeBps,
      unit: "basis_points",
    },
  ];
}

export function validateFredTipsHistoricalYear(
  value: unknown,
  currentYear = new Date().getUTCFullYear(),
) {
  const year = typeof value === "number" ? value : Number(value);
  if (
    !Number.isInteger(year) ||
    year < FRED_DFII10_MIN_YEAR ||
    year > currentYear
  ) {
    return null;
  }
  return year;
}

export function buildFredTipsHistoricalUrl(year: number, apiKey: string) {
  const validatedYear = validateFredTipsHistoricalYear(year);
  if (!validatedYear) throw new Error(`Invalid FRED DFII10 year: ${year}`);

  const params = new URLSearchParams({
    series_id: "DFII10",
    file_type: "json",
    api_key: apiKey,
    observation_start: `${validatedYear - 1}-12-01`,
    observation_end: `${validatedYear}-12-31`,
    sort_order: "asc",
    limit: "1000",
  });
  return `https://api.stlouisfed.org/fred/series/observations?${params}`;
}

export function buildFredTipsHistoricalObservations(
  data: FredResponse,
  year: number,
): EvidenceObservation[] {
  const validatedYear = validateFredTipsHistoricalYear(year);
  if (!validatedYear) throw new Error(`Invalid FRED DFII10 year: ${year}`);

  const observations = parseFredTipsObservations(data).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  if (observations.length < 2) {
    throw new Error(
      data.error_message ?? "FRED DFII10 did not return enough valid history",
    );
  }

  return observations.flatMap((entry, index) => {
    if (Number(entry.date.slice(0, 4)) !== validatedYear) return [];
    const previous = observations[index - 1];
    const metadata = {
      seriesId: "DFII10",
      historicalArchiveYear: validatedYear,
      methodologyVersion:
        TIPS_DRIVER?.methodologyVersion ?? "tips-real-yield.v1",
    };
    const direct: EvidenceObservation = {
      sourceKey: "fred-dfii10",
      driverKey: "tips-real-yield",
      seriesKey: "dfii10_yield_percent",
      numericValue: entry.value,
      unit: "percent",
      observedAt: `${entry.date}T00:00:00Z`,
      releasedAt: null,
      sourceUrl: FRED_DFII10_SOURCE_URL,
      quality: "delayed",
      metadata,
    };
    if (!previous) return [direct];

    return [
      direct,
      {
        ...direct,
        seriesKey: "dfii10_change_bps",
        numericValue: Math.round((entry.value - previous.value) * 100),
        unit: "basis_points",
        metadata: {
          ...metadata,
          previousObservationDate: previous.date,
        },
      },
    ];
  });
}

export async function fetchTipsYields(
  fetchFn: typeof fetch = fetch,
): Promise<IngestionResult> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return {
      key: "tips-yields",
      status: "error",
      error: "FRED_API_KEY not set",
    };
  }

  try {
    const response = await fetchFn(`${FRED_DFII10_URL}&api_key=${apiKey}`, {
      signal: AbortSignal.timeout(7_500),
    });
    if (!response.ok) {
      throw new Error(`FRED returned ${response.status}`);
    }

    const report = parseFredTipsResponse((await response.json()) as FredResponse);
    const observedAt = `${report.latestDate}T00:00:00Z`;
    const snapshot: IndicatorSnapshot = {
      key: "tips-yields",
      name: "10Y TIPS Real Yield",
      source: "Federal Reserve Bank of St. Louis (FRED)",
      cadence: "Daily",
      value: `${report.yieldPercent.toFixed(2)}%`,
      change: `${report.changeBps >= 0 ? "+" : ""}${report.changeBps} bps`,
      status: determineStatus(report.yieldPercent),
      summary: buildSummary(report.yieldPercent, report.changeBps),
      observedAt,
      observedLabel: formatObservedLabel(new Date(observedAt)),
      dataQuality: "delayed",
      qualityNote:
        "Verified FRED DFII10 observations. Change uses the two latest valid published values.",
    };

    return {
      key: snapshot.key,
      status: "success",
      data: snapshot,
      observations: buildObservations(report),
    };
  } catch (error) {
    return {
      key: "tips-yields",
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export {
  FRED_DFII10_MIN_YEAR,
  FRED_DFII10_SOURCE_URL,
  FRED_DFII10_URL,
};

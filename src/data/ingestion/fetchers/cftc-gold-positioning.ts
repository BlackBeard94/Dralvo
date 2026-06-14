import { parse } from "csv-parse/sync";
import { strFromU8, unzipSync } from "fflate";

import { DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import type { IndicatorSnapshot } from "@/data/indicators";
import type { EvidenceObservation, IngestionResult } from "@/data/ingestion/types";
import { formatObservedLabel } from "@/data/ingestion/types";

const CFTC_DISAGGREGATED_FUTURES_URL =
  "https://www.cftc.gov/dea/newcot/f_disagg.txt";
const CFTC_HISTORICAL_MIN_YEAR = 2009;
const GOLD_CONTRACT_MARKET_CODE = "088691";
const CFTC_GOLD_DRIVER = DRIVER_SOURCE_REGISTRY.find(
  (driver) => driver.driverKey === "cftc-gold-positioning",
);

const FIELD = {
  marketName: 0,
  reportDate: 2,
  contractMarketCode: 3,
  openInterest: 7,
  producerLong: 8,
  producerShort: 9,
  swapLong: 10,
  swapShort: 11,
  managedMoneyLong: 13,
  managedMoneyShort: 14,
  changeSwapLong: 58,
  changeSwapShort: 59,
  changeManagedMoneyLong: 61,
  changeManagedMoneyShort: 62,
} as const;

type CftcGoldReport = {
  marketName: string;
  reportDate: string;
  contractMarketCode: string;
  openInterest: number;
  producerLong: number;
  producerShort: number;
  swapLong: number;
  swapShort: number;
  managedMoneyLong: number;
  managedMoneyShort: number;
  changeSwapLong: number;
  changeSwapShort: number;
  changeManagedMoneyLong: number;
  changeManagedMoneyShort: number;
};

function requiredNumber(row: string[], index: number, fieldName: string) {
  const value = Number(row[index]?.trim());
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid CFTC ${fieldName}: ${row[index] ?? "missing"}`);
  }
  return value;
}

function parseCftcGoldRow(row: string[]): CftcGoldReport {
  const reportDate = row[FIELD.reportDate]?.trim();
  if (!reportDate || !Number.isFinite(Date.parse(`${reportDate}T00:00:00Z`))) {
    throw new Error(`Invalid CFTC report date: ${reportDate ?? "missing"}`);
  }

  return {
    marketName: row[FIELD.marketName]?.trim() ?? "Gold COMEX",
    reportDate,
    contractMarketCode: GOLD_CONTRACT_MARKET_CODE,
    openInterest: requiredNumber(row, FIELD.openInterest, "open interest"),
    producerLong: requiredNumber(row, FIELD.producerLong, "producer long"),
    producerShort: requiredNumber(row, FIELD.producerShort, "producer short"),
    swapLong: requiredNumber(row, FIELD.swapLong, "swap long"),
    swapShort: requiredNumber(row, FIELD.swapShort, "swap short"),
    managedMoneyLong: requiredNumber(
      row,
      FIELD.managedMoneyLong,
      "managed money long",
    ),
    managedMoneyShort: requiredNumber(
      row,
      FIELD.managedMoneyShort,
      "managed money short",
    ),
    changeSwapLong: requiredNumber(
      row,
      FIELD.changeSwapLong,
      "weekly swap long change",
    ),
    changeSwapShort: requiredNumber(
      row,
      FIELD.changeSwapShort,
      "weekly swap short change",
    ),
    changeManagedMoneyLong: requiredNumber(
      row,
      FIELD.changeManagedMoneyLong,
      "weekly managed money long change",
    ),
    changeManagedMoneyShort: requiredNumber(
      row,
      FIELD.changeManagedMoneyShort,
      "weekly managed money short change",
    ),
  };
}

export function parseCftcGoldDisaggregatedCsv(csvText: string): CftcGoldReport {
  const rows = parse(csvText, {
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as string[][];

  const row = rows.find(
    (candidate) =>
      candidate[FIELD.contractMarketCode]?.trim() === GOLD_CONTRACT_MARKET_CODE,
  );

  if (!row) {
    throw new Error("CFTC Gold COMEX contract 088691 was not found");
  }

  return parseCftcGoldRow(row);
}

function observation(
  report: CftcGoldReport,
  seriesKey: string,
  numericValue: number,
  options?: {
    observedAt?: string;
    sourceUrl?: string;
    metadata?: Record<string, unknown>;
  },
): EvidenceObservation {
  return {
    sourceKey: "cftc-disaggregated-futures",
    driverKey: "cftc-gold-positioning",
    seriesKey,
    numericValue,
    unit: "contracts",
    observedAt: options?.observedAt ?? `${report.reportDate}T00:00:00Z`,
    releasedAt: null,
    sourceUrl: options?.sourceUrl ?? CFTC_DISAGGREGATED_FUTURES_URL,
    quality: "verified",
    metadata: {
      marketName: report.marketName,
      contractMarketCode: report.contractMarketCode,
      reportType: "disaggregated-futures-only",
      contractUnit: "100 troy ounces",
      methodologyVersion: CFTC_GOLD_DRIVER?.methodologyVersion ?? "cftc-gold-positioning.v1",
      ...(options?.metadata ?? {}),
    },
  };
}

export function parseCftcGoldDisaggregatedReports(csvText: string): CftcGoldReport[] {
  const rows = parse(csvText, {
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as string[][];

  const reports = rows
    .filter(
      (candidate) =>
        candidate[FIELD.contractMarketCode]?.trim() === GOLD_CONTRACT_MARKET_CODE,
    )
    .map(parseCftcGoldRow)
    .sort((a, b) => Date.parse(a.reportDate) - Date.parse(b.reportDate));

  if (reports.length === 0) {
    throw new Error("CFTC Gold COMEX contract 088691 was not found");
  }

  return reports;
}

export function buildCftcGoldObservations(
  report: CftcGoldReport,
  options?: {
    includeDerivedPrevious?: boolean;
    sourceUrl?: string;
    metadata?: Record<string, unknown>;
  },
): EvidenceObservation[] {
  const swapNet = report.swapLong - report.swapShort;
  const managedMoneyNet = report.managedMoneyLong - report.managedMoneyShort;
  const managedMoneyNetChange =
    report.changeManagedMoneyLong - report.changeManagedMoneyShort;
  const previousReportDate = new Date(`${report.reportDate}T00:00:00Z`);
  previousReportDate.setUTCDate(previousReportDate.getUTCDate() - 7);
  const previousObservedAt = previousReportDate.toISOString();

  const observationOptions = {
    sourceUrl: options?.sourceUrl,
    metadata: options?.metadata,
  };
  const observations = [
    observation(report, "open_interest", report.openInterest, observationOptions),
    observation(report, "producer_merchant_long", report.producerLong, observationOptions),
    observation(report, "producer_merchant_short", report.producerShort, observationOptions),
    observation(
      report,
      "producer_merchant_net",
      report.producerLong - report.producerShort,
      observationOptions,
    ),
    observation(report, "swap_dealer_long", report.swapLong, observationOptions),
    observation(report, "swap_dealer_short", report.swapShort, observationOptions),
    observation(report, "swap_dealer_net", swapNet, observationOptions),
    observation(report, "managed_money_long", report.managedMoneyLong, observationOptions),
    observation(report, "managed_money_short", report.managedMoneyShort, observationOptions),
    observation(report, "managed_money_net", managedMoneyNet, observationOptions),
  ];

  if (options?.includeDerivedPrevious === false) return observations;

  observations.push(
    observation(
      report,
      "managed_money_net",
      managedMoneyNet - managedMoneyNetChange,
      {
        observedAt: previousObservedAt,
        metadata: {
          ...(options?.metadata ?? {}),
          derivedFromCurrentPositionAndOfficialWeeklyChange: true,
          currentReportDate: report.reportDate,
        },
        sourceUrl: options?.sourceUrl,
      },
    ),
  );

  return observations;
}

export function cftcHistoricalArchiveUrl(year: number) {
  return `https://www.cftc.gov/files/dea/history/fut_disagg_txt_${year}.zip`;
}

export function validateCftcHistoricalYear(
  value: unknown,
  currentYear = new Date().getUTCFullYear(),
) {
  const year = typeof value === "number" ? value : Number(value);
  if (
    !Number.isInteger(year) ||
    year < CFTC_HISTORICAL_MIN_YEAR ||
    year > currentYear
  ) {
    return null;
  }
  return year;
}

export function parseCftcHistoricalArchive(
  input: ArrayBuffer | Uint8Array,
  year: number,
) {
  const validatedYear = validateCftcHistoricalYear(year);
  if (!validatedYear) throw new Error(`Invalid CFTC historical year: ${year}`);

  const archive = unzipSync(
    input instanceof Uint8Array ? input : new Uint8Array(input),
  );
  const reportBytes =
    archive["f_year.txt"] ??
    Object.entries(archive).find(([name]) => name.endsWith(".txt"))?.[1];
  if (!reportBytes) {
    throw new Error("CFTC historical archive did not contain a text report");
  }

  const sourceUrl = cftcHistoricalArchiveUrl(validatedYear);
  const reports = parseCftcGoldDisaggregatedReports(strFromU8(reportBytes));
  const observations = reports.flatMap((report) =>
    buildCftcGoldObservations(report, {
      includeDerivedPrevious: false,
      sourceUrl,
      metadata: {
        historicalArchiveYear: validatedYear,
        historicalArchiveFile: "f_year.txt",
      },
    }),
  );

  return { reports, observations, sourceUrl };
}

export async function fetchCftcGoldPositioning(
  fetchFn: typeof fetch = fetch,
): Promise<IngestionResult> {
  try {
    const response = await fetchFn(CFTC_DISAGGREGATED_FUTURES_URL, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        accept: "text/plain,text/csv;q=0.9,*/*;q=0.8",
        "user-agent": "Dralvo/1.0 (gold research data ingestion)",
      },
    });

    if (!response.ok) {
      throw new Error(`CFTC returned ${response.status}`);
    }

    const report = parseCftcGoldDisaggregatedCsv(await response.text());
    const observedAt = `${report.reportDate}T00:00:00Z`;
    const managedMoneyNet = report.managedMoneyLong - report.managedMoneyShort;
    const managedMoneyNetChange =
      report.changeManagedMoneyLong - report.changeManagedMoneyShort;
    const swapNet = report.swapLong - report.swapShort;
    const swapNetChange = report.changeSwapLong - report.changeSwapShort;

    const snapshot: IndicatorSnapshot = {
      key: "cftc-gold-positioning",
      name: "CFTC Gold Positioning",
      source: "CFTC Disaggregated Futures-Only",
      cadence: "Weekly",
      value: `Managed Money net ${managedMoneyNet.toLocaleString("en-US")}`,
      change:
        `${managedMoneyNetChange >= 0 ? "+" : ""}` +
        `${managedMoneyNetChange.toLocaleString("en-US")} w/w`,
      status: "neutral",
      summary:
        `Managed Money net position is ${managedMoneyNet.toLocaleString("en-US")} contracts ` +
        `(${managedMoneyNetChange >= 0 ? "+" : ""}${managedMoneyNetChange.toLocaleString("en-US")} weekly). ` +
        `Swap Dealer net position is ${swapNet.toLocaleString("en-US")} contracts ` +
        `(${swapNetChange >= 0 ? "+" : ""}${swapNetChange.toLocaleString("en-US")} weekly). ` +
        "These are positioning observations, not a directional signal.",
      observedAt,
      observedLabel: formatObservedLabel(new Date(observedAt)),
      dataQuality: "delayed",
      qualityNote:
        "Verified CFTC futures-only report. Published weekly, generally Friday, for positions held on Tuesday.",
    };

    return {
      key: snapshot.key,
      status: "success",
      data: snapshot,
      observations: [
        ...buildCftcGoldObservations(report),
      ],
    };
  } catch (error) {
    return {
      key: "cftc-gold-positioning",
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export {
  CFTC_DISAGGREGATED_FUTURES_URL,
  CFTC_HISTORICAL_MIN_YEAR,
  GOLD_CONTRACT_MARKET_CODE,
};

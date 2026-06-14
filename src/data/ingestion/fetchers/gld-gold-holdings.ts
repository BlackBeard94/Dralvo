import { XMLParser } from "fast-xml-parser";
import { strFromU8, unzipSync } from "fflate";

import { DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import type { IndicatorSnapshot } from "@/data/indicators";
import type { EvidenceObservation, IngestionResult } from "@/data/ingestion/types";
import { formatObservedLabel } from "@/data/ingestion/types";

const GLD_HISTORICAL_ARCHIVE_URL =
  "https://api.spdrgoldshares.com/api/v1/historical-archive?product=gld&exchange=NYSE&lang=en";
const GLD_HISTORICAL_MIN_YEAR = 2004;
const GLD_DRIVER = DRIVER_SOURCE_REGISTRY.find(
  (driver) => driver.driverKey === "gld-gold-holdings",
);
const GLD_WORKSHEET_NAME = "US GLD Historical Archive";

export type GldHoldingsObservation = {
  date: string;
  tonnes: number;
  totalOunces: number;
  totalNavUsd: number;
  closingPriceUsd: number | null;
};

export type GldHoldingsReport = {
  latest: GldHoldingsObservation;
  previous: GldHoldingsObservation;
  history: GldHoldingsObservation[];
};

function normalizeDate(value: unknown) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;

  const monthIndex = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ].indexOf(match[2].toLowerCase());
  if (monthIndex < 0) return null;

  return `${match[3]}-${String(monthIndex + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function numericCell(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function parseXml(bytes: Uint8Array) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: false,
    processEntities: false,
  });
  return parser.parse(strFromU8(bytes)) as Record<string, unknown>;
}

function sharedStringText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const item = value as Record<string, unknown>;
  if (typeof item.t === "string") return item.t;

  return asArray(item.r as Record<string, unknown> | Record<string, unknown>[])
    .map((run) => (typeof run.t === "string" ? run.t : ""))
    .join("");
}

function cellValue(
  cell: Record<string, unknown>,
  sharedStrings: string[],
) {
  const raw = cell.v;
  if (raw === undefined || raw === null) return "";
  const value = String(raw);
  return cell["@_t"] === "s"
    ? sharedStrings[Number.parseInt(value, 10)] ?? ""
    : value;
}

export async function parseGldHistoricalArchive(
  input: Buffer | ArrayBuffer | Uint8Array,
): Promise<GldHoldingsReport> {
  const bytes = input instanceof ArrayBuffer
    ? new Uint8Array(input)
    : Uint8Array.from(input);
  const archive = unzipSync(bytes);
  const workbookBytes = archive["xl/workbook.xml"];
  const relationshipsBytes = archive["xl/_rels/workbook.xml.rels"];
  const sharedStringsBytes = archive["xl/sharedStrings.xml"];
  if (!workbookBytes || !relationshipsBytes) {
    throw new Error("GLD archive is missing workbook metadata");
  }

  const workbook = parseXml(workbookBytes) as {
    workbook?: { sheets?: { sheet?: Record<string, unknown> | Record<string, unknown>[] } };
  };
  const sheets = asArray(workbook.workbook?.sheets?.sheet);
  const sheet = sheets.find(
    (candidate) => candidate["@_name"] === GLD_WORKSHEET_NAME,
  );
  if (!sheet) {
    throw new Error(`GLD worksheet not found: ${GLD_WORKSHEET_NAME}`);
  }

  const relationshipId = String(sheet["@_id"] ?? sheet["@_r:id"] ?? "");
  const relationships = parseXml(relationshipsBytes) as {
    Relationships?: {
      Relationship?: Record<string, unknown> | Record<string, unknown>[];
    };
  };
  const relationship = asArray(
    relationships.Relationships?.Relationship,
  ).find((candidate) => candidate["@_Id"] === relationshipId);
  const target = String(relationship?.["@_Target"] ?? "");
  const worksheetPath = target.startsWith("/")
    ? target.slice(1)
    : `xl/${target.replace(/^\.?\//, "")}`;
  const worksheetBytes = archive[worksheetPath];
  if (!worksheetBytes) {
    throw new Error(`GLD worksheet file not found: ${worksheetPath}`);
  }

  const sharedStrings = sharedStringsBytes
    ? (() => {
        const parsed = parseXml(sharedStringsBytes) as {
          sst?: { si?: unknown | unknown[] };
        };
        return asArray(parsed.sst?.si).map(sharedStringText);
      })()
    : [];
  const worksheet = parseXml(worksheetBytes) as {
    worksheet?: {
      sheetData?: {
        row?: Record<string, unknown> | Record<string, unknown>[];
      };
    };
  };
  const rows = asArray(worksheet.worksheet?.sheetData?.row);
  if (rows.length === 0) {
    throw new Error("GLD worksheet did not contain rows");
  }

  const headers = new Map<string, number>();
  const headerCells = asArray(
    rows[0].c as Record<string, unknown> | Record<string, unknown>[],
  );
  headerCells.forEach((cell, index) => {
    headers.set(cellValue(cell, sharedStrings).trim(), index);
  });

  const dateColumn = headers.get("Date");
  const closingPriceColumn = headers.get("Closing Price");
  const ouncesColumn = headers.get("Total Ounces of Gold in the Trust");
  const tonnesColumn = headers.get("Tonnes of Gold");
  const navColumn = headers.get("Total Net Asset Value in the Trust");

  if (
    dateColumn === undefined ||
    ouncesColumn === undefined ||
    tonnesColumn === undefined ||
    navColumn === undefined
  ) {
    throw new Error("GLD archive is missing required holdings columns");
  }

  const history: GldHoldingsObservation[] = [];

  rows.slice(1).forEach((row) => {
    const cells = asArray(
      row.c as Record<string, unknown> | Record<string, unknown>[],
    );
    const values = cells.map((cell) => cellValue(cell, sharedStrings));
    const date = normalizeDate(values[dateColumn]);
    const tonnes = numericCell(values[tonnesColumn]);
    const totalOunces = numericCell(values[ouncesColumn]);
    const totalNavUsd = numericCell(values[navColumn]);

    if (!date || tonnes === null || totalOunces === null || totalNavUsd === null) {
      return;
    }

    history.push({
      date,
      tonnes,
      totalOunces,
      totalNavUsd,
      closingPriceUsd: closingPriceColumn !== undefined
        ? numericCell(values[closingPriceColumn])
        : null,
    });
  });

  history.sort((a, b) => a.date.localeCompare(b.date));
  if (history.length < 2) {
    throw new Error("GLD archive did not contain two valid holdings observations");
  }

  return {
    latest: history.at(-1)!,
    previous: history.at(-2)!,
    history,
  };
}

function holdingsStatus(changeTonnes: number): IndicatorSnapshot["status"] {
  if (changeTonnes > 0.5) return "bullish";
  if (changeTonnes < -0.5) return "bearish";
  return "neutral";
}

function observation(
  entry: GldHoldingsObservation,
  seriesKey: string,
  numericValue: number,
  unit: string,
  metadata?: Record<string, unknown>,
): EvidenceObservation {
  return {
    sourceKey: "spdr-gold-shares",
    driverKey: "gld-gold-holdings",
    seriesKey,
    numericValue,
    unit,
    observedAt: `${entry.date}T00:00:00Z`,
    releasedAt: null,
    sourceUrl: GLD_HISTORICAL_ARCHIVE_URL,
    quality: "verified",
    metadata: {
      fund: "SPDR Gold Trust",
      ticker: "GLD",
      exchange: "NYSE Arca",
      methodologyVersion:
        GLD_DRIVER?.methodologyVersion ?? "gld-gold-holdings.v1",
      ...(metadata ?? {}),
    },
  };
}

function buildObservations(report: GldHoldingsReport): EvidenceObservation[] {
  const changeTonnes = report.latest.tonnes - report.previous.tonnes;

  return [
    observation(report.latest, "gld_tonnes", report.latest.tonnes, "metric_tonnes"),
    observation(
      report.latest,
      "gld_holdings_change_tonnes",
      changeTonnes,
      "metric_tonnes",
      { changeBasisDate: report.previous.date },
    ),
    observation(
      report.latest,
      "gld_total_ounces",
      report.latest.totalOunces,
      "troy_ounces",
    ),
    observation(
      report.latest,
      "gld_total_nav_usd",
      report.latest.totalNavUsd,
      "usd",
    ),
  ];
}

export function validateGldHistoricalYear(
  value: unknown,
  currentYear = new Date().getUTCFullYear(),
) {
  const year = typeof value === "number" ? value : Number(value);
  if (
    !Number.isInteger(year) ||
    year < GLD_HISTORICAL_MIN_YEAR ||
    year > currentYear
  ) {
    return null;
  }
  return year;
}

export function buildGldHistoricalObservations(
  report: GldHoldingsReport,
  year: number,
) {
  const validatedYear = validateGldHistoricalYear(year);
  if (!validatedYear) throw new Error(`Invalid GLD historical year: ${year}`);

  return report.history.flatMap((entry, index) => {
    if (Number(entry.date.slice(0, 4)) !== validatedYear) return [];

    const previous = report.history[index - 1];
    const direct = [
      observation(entry, "gld_tonnes", entry.tonnes, "metric_tonnes", {
        historicalArchiveYear: validatedYear,
      }),
      observation(
        entry,
        "gld_total_ounces",
        entry.totalOunces,
        "troy_ounces",
        { historicalArchiveYear: validatedYear },
      ),
      observation(
        entry,
        "gld_total_nav_usd",
        entry.totalNavUsd,
        "usd",
        { historicalArchiveYear: validatedYear },
      ),
    ];

    if (!previous) return direct;

    return [
      ...direct,
      observation(
        entry,
        "gld_holdings_change_tonnes",
        entry.tonnes - previous.tonnes,
        "metric_tonnes",
        {
          historicalArchiveYear: validatedYear,
          changeBasisDate: previous.date,
        },
      ),
    ];
  });
}

function buildSnapshot(report: GldHoldingsReport): IndicatorSnapshot {
  const changeTonnes = report.latest.tonnes - report.previous.tonnes;
  const observedAt = `${report.latest.date}T00:00:00Z`;
  const direction = changeTonnes > 0 ? "increased" : changeTonnes < 0 ? "decreased" : "was unchanged";

  return {
    key: "gld-gold-holdings",
    name: "GLD Gold Holdings",
    source: "SPDR Gold Shares",
    cadence: "Daily",
    value: `${report.latest.tonnes.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} tonnes`,
    change: `${changeTonnes >= 0 ? "+" : ""}${changeTonnes.toFixed(2)} tonnes`,
    status: holdingsStatus(changeTonnes),
    summary:
      `GLD reported ${report.latest.tonnes.toFixed(2)} tonnes of gold on ${report.latest.date}. ` +
      `Holdings ${direction} by ${Math.abs(changeTonnes).toFixed(2)} tonnes from ${report.previous.date}. ` +
      "This is a physical holdings change, not a reported capital-flow figure.",
    observedAt,
    observedLabel: formatObservedLabel(new Date(observedAt)),
    dataQuality: "delayed",
    qualityNote:
      "Verified SPDR Gold Shares historical archive. Holdings changes are derived from consecutive issuer observations.",
    sparkline: report.history.slice(-30).map((entry) => entry.tonnes),
  };
}

export async function fetchGldGoldHoldings(
  fetchFn: typeof fetch = fetch,
): Promise<IngestionResult> {
  try {
    const response = await fetchFn(GLD_HISTORICAL_ARCHIVE_URL, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*;q=0.8",
        "user-agent": "Dralvo/1.0 (gold research data ingestion)",
      },
    });

    if (!response.ok) {
      throw new Error(`SPDR Gold Shares returned ${response.status}`);
    }

    const report = await parseGldHistoricalArchive(await response.arrayBuffer());
    const snapshot = buildSnapshot(report);

    return {
      key: snapshot.key,
      status: "success",
      data: snapshot,
      observations: buildObservations(report),
    };
  } catch (error) {
    return {
      key: "gld-gold-holdings",
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export { GLD_HISTORICAL_ARCHIVE_URL, GLD_HISTORICAL_MIN_YEAR };

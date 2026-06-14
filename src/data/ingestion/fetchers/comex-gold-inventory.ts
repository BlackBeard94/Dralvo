import { DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import type { IndicatorSnapshot } from "@/data/indicators";
import type { EvidenceObservation, IngestionResult } from "@/data/ingestion/types";
import { formatObservedLabel } from "@/data/ingestion/types";
import { read, utils } from "xlsx";

const COMEX_GOLD_STOCKS_URL =
  "https://www.cmegroup.com/delivery_reports/Gold_Stocks.xls";
const COMEX_REGISTRAR_REPORTS_URL =
  "https://www.cmegroup.com/clearing/operations-and-deliveries/registrar-reports.html";
const COMEX_GOLD_DRIVER = DRIVER_SOURCE_REGISTRY.find(
  (driver) => driver.driverKey === "comex-gold-inventory",
);

type ComexInventoryReport = {
  reportDate: string;
  activityDate: string;
  registeredOunces: number;
  registeredNetChangeOunces: number;
  pledgedOunces: number;
  eligibleOunces: number;
  eligibleNetChangeOunces: number;
  combinedTotalOunces: number;
  combinedNetChangeOunces: number;
};

function parseNumber(value: string | undefined) {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseUsDate(value: string) {
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function stripTags(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseHtmlRows(input: string) {
  const rowMatches = [...input.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  if (rowMatches.length === 0) return [];

  return rowMatches.map((rowMatch) => {
    const cells = [...rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
    return cells.map((cell) => stripTags(cell[1]));
  });
}

function parseMarkdownRows(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*-+/.test(line))
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => stripTags(cell)),
    );
}

function rowsFromReport(input: string) {
  const htmlRows = parseHtmlRows(input);
  return htmlRows.length > 0 ? htmlRows : parseMarkdownRows(input);
}

function findDate(rows: string[][], label: string) {
  for (const row of rows) {
    const joined = row.join(" ");
    if (!joined.toLowerCase().includes(label.toLowerCase())) continue;
    const parsed = parseUsDate(joined);
    if (parsed) return parsed;
  }
  return null;
}

function findTotalRow(rows: string[][], label: string) {
  const row = rows.find(
    (candidate) => candidate[0]?.trim().toUpperCase() === label,
  );
  if (!row) {
    throw new Error(`COMEX row not found: ${label}`);
  }
  return row;
}

function findColumnIndex(rows: string[][], label: string) {
  const normalizedLabel = label.trim().toUpperCase();

  for (const row of rows) {
    const index = row.findIndex(
      (cell) => cell.trim().toUpperCase() === normalizedLabel,
    );
    if (index >= 0) return index;
  }

  throw new Error(`COMEX column not found: ${label}`);
}

function totalToday(row: string[], columnIndex: number) {
  const value = parseNumber(row[columnIndex]);
  if (value === null) {
    throw new Error(`Invalid COMEX total today value for ${row[0] ?? "row"}`);
  }
  return value;
}

function netChange(row: string[], columnIndex: number) {
  const value = parseNumber(row[columnIndex]);
  if (value === null) return 0;
  return value;
}

function parseComexGoldInventoryRows(rows: string[][]): ComexInventoryReport {
  if (rows.length === 0) {
    throw new Error("COMEX gold inventory report did not contain any rows");
  }

  const reportDate = findDate(rows, "Report Date");
  const activityDate = findDate(rows, "Activity Date");
  if (!reportDate || !activityDate) {
    throw new Error("COMEX report dates were not found");
  }

  const registeredRow = findTotalRow(rows, "TOTAL REGISTERED");
  const pledgedRow = findTotalRow(rows, "TOTAL PLEDGED");
  const eligibleRow = findTotalRow(rows, "TOTAL ELIGIBLE");
  const combinedRow = findTotalRow(rows, "COMBINED TOTAL");
  const netChangeColumn = findColumnIndex(rows, "NET CHANGE");
  const totalTodayColumn = findColumnIndex(rows, "TOTAL TODAY");

  return {
    reportDate,
    activityDate,
    registeredOunces: totalToday(registeredRow, totalTodayColumn),
    registeredNetChangeOunces: netChange(registeredRow, netChangeColumn),
    pledgedOunces: totalToday(pledgedRow, totalTodayColumn),
    eligibleOunces: totalToday(eligibleRow, totalTodayColumn),
    eligibleNetChangeOunces: netChange(eligibleRow, netChangeColumn),
    combinedTotalOunces: totalToday(combinedRow, totalTodayColumn),
    combinedNetChangeOunces: netChange(combinedRow, netChangeColumn),
  };
}

export function parseComexGoldInventoryReport(input: string): ComexInventoryReport {
  return parseComexGoldInventoryRows(rowsFromReport(input));
}

export function parseComexGoldInventoryPayload(
  input: ArrayBuffer | Uint8Array,
): ComexInventoryReport {
  const payload = input instanceof Uint8Array ? input : new Uint8Array(input);
  const isLegacyExcel =
    payload.length >= 8 &&
    [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every(
      (byte, index) => payload[index] === byte,
    );

  if (!isLegacyExcel) {
    return parseComexGoldInventoryReport(new TextDecoder("utf-8").decode(payload));
  }

  const workbook = read(payload, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!worksheet) {
    throw new Error("COMEX workbook did not contain a worksheet");
  }

  const rows = utils
    .sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      raw: true,
      defval: "",
    })
    .map((row) => row.map((cell) => String(cell).trim()));

  return parseComexGoldInventoryRows(rows);
}

function observation(
  report: ComexInventoryReport,
  seriesKey: string,
  numericValue: number,
): EvidenceObservation {
  return {
    sourceKey: "cme-delivery-reports",
    driverKey: "comex-gold-inventory",
    seriesKey,
    numericValue,
    unit: "troy_ounces",
    observedAt: `${report.activityDate}T00:00:00Z`,
    releasedAt: `${report.reportDate}T00:00:00Z`,
    sourceUrl: COMEX_GOLD_STOCKS_URL,
    quality: "verified",
    metadata: {
      reportName: "Daily Metal Stocks Report",
      exchange: "COMEX",
      metal: "Gold",
      methodologyVersion: COMEX_GOLD_DRIVER?.methodologyVersion ?? "comex-gold-inventory.v1",
    },
  };
}

function buildObservations(report: ComexInventoryReport): EvidenceObservation[] {
  return [
    observation(report, "registered_ounces", report.registeredOunces),
    observation(report, "registered_net_change_ounces", report.registeredNetChangeOunces),
    observation(report, "pledged_ounces", report.pledgedOunces),
    observation(report, "eligible_ounces", report.eligibleOunces),
    observation(report, "eligible_net_change_ounces", report.eligibleNetChangeOunces),
    observation(report, "combined_total_ounces", report.combinedTotalOunces),
    observation(report, "combined_net_change_ounces", report.combinedNetChangeOunces),
  ];
}

function buildSnapshot(report: ComexInventoryReport): IndicatorSnapshot {
  const observedAt = `${report.activityDate}T00:00:00Z`;

  return {
    key: "comex-gold-inventory",
    name: "COMEX Gold Inventory",
    source: "CME Daily Metal Stocks Report",
    cadence: "Daily",
    value: `Registered ${Math.round(report.registeredOunces).toLocaleString("en-US")} oz`,
    change:
      `${report.registeredNetChangeOunces >= 0 ? "+" : ""}` +
      `${Math.round(report.registeredNetChangeOunces).toLocaleString("en-US")} oz registered`,
    status: "neutral",
    summary:
      `COMEX registered gold stocks are ${Math.round(report.registeredOunces).toLocaleString("en-US")} oz, ` +
      `eligible stocks are ${Math.round(report.eligibleOunces).toLocaleString("en-US")} oz, ` +
      `and combined stocks are ${Math.round(report.combinedTotalOunces).toLocaleString("en-US")} oz. ` +
      "This is inventory evidence, not a directional signal.",
    observedAt,
    observedLabel: formatObservedLabel(new Date(observedAt)),
    dataQuality: "delayed",
    qualityNote:
      "Verified CME Daily Metal Stocks Report. Activity date is the inventory observation date.",
  };
}

export async function fetchComexGoldInventory(
  fetchFn: typeof fetch = fetch,
): Promise<IngestionResult> {
  try {
    const response = await fetchFn(COMEX_GOLD_STOCKS_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
      headers: {
        accept:
          "application/vnd.ms-excel,application/octet-stream,text/html;q=0.8,*/*;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        referer: COMEX_REGISTRAR_REPORTS_URL,
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`CME returned ${response.status}`);
    }

    const payload = new Uint8Array(await response.arrayBuffer());
    let report: ComexInventoryReport;

    try {
      report = parseComexGoldInventoryPayload(payload);
    } catch (error) {
      const signature = Array.from(payload.slice(0, 12), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      const contentType = response.headers.get("content-type") ?? "unknown";
      const message = error instanceof Error ? error.message : String(error);

      throw new Error(
        `${message}; content-type=${contentType}; bytes=${payload.byteLength}; signature=${signature}`,
      );
    }
    const snapshot = buildSnapshot(report);

    return {
      key: snapshot.key,
      status: "success",
      data: snapshot,
      observations: buildObservations(report),
    };
  } catch (error) {
    return {
      key: "comex-gold-inventory",
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export { COMEX_GOLD_STOCKS_URL };

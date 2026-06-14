import { describe, expect, it, vi } from "vitest";
import { strToU8, zipSync } from "fflate";

import {
  buildCftcGoldObservations,
  fetchCftcGoldPositioning,
  parseCftcGoldDisaggregatedCsv,
  parseCftcGoldDisaggregatedReports,
  parseCftcHistoricalArchive,
  validateCftcHistoricalYear,
} from "./cftc-gold-positioning";

function cftcRow(contractCode = "088691") {
  const row = Array.from({ length: 64 }, () => "0");
  row[0] = "GOLD - COMMODITY EXCHANGE INC.";
  row[2] = "2026-06-02";
  row[3] = contractCode;
  row[7] = "326052";
  row[8] = "10275";
  row[9] = "30429";
  row[10] = "27505";
  row[11] = "213696";
  row[13] = "129367";
  row[14] = "17188";
  row[58] = "-1528";
  row[59] = "18407";
  row[61] = "5090";
  row[62] = "-9643";

  return row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",");
}

function cftcRowForDate(reportDate: string) {
  const row = cftcRow().split(",");
  row[2] = `"${reportDate}"`;
  return row.join(",");
}

describe("CFTC Gold positioning ingestion", () => {
  it("parses the official disaggregated column positions for Gold COMEX", () => {
    const report = parseCftcGoldDisaggregatedCsv(
      [cftcRow("001602"), cftcRow()].join("\n"),
    );

    expect(report).toMatchObject({
      contractMarketCode: "088691",
      reportDate: "2026-06-02",
      openInterest: 326052,
      swapLong: 27505,
      swapShort: 213696,
      managedMoneyLong: 129367,
      managedMoneyShort: 17188,
    });
  });

  it("returns a factual snapshot and traceable evidence observations", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(cftcRow(), {
        status: 200,
        headers: { "content-type": "text/plain" },
      }),
    );

    const result = await fetchCftcGoldPositioning(fetchFn);

    expect(result.status).toBe("success");
    if (result.status !== "success") return;

    expect(result.data).toMatchObject({
      key: "cftc-gold-positioning",
      observedAt: "2026-06-02T00:00:00Z",
      dataQuality: "delayed",
      status: "neutral",
    });
    expect(result.data.value).toContain("112,179");
    expect(result.data.change).toContain("+14,733");
    expect(result.observations).toHaveLength(11);
    expect(result.observations).toContainEqual(
      expect.objectContaining({
        seriesKey: "managed_money_net",
        numericValue: 112179,
        quality: "verified",
      }),
    );
    expect(result.observations).toContainEqual(
      expect.objectContaining({
        seriesKey: "managed_money_net",
        numericValue: 97446,
        observedAt: "2026-05-26T00:00:00.000Z",
        metadata: expect.objectContaining({
          derivedFromCurrentPositionAndOfficialWeeklyChange: true,
        }),
      }),
    );
  });

  it("parses multiple Gold rows sorted by report date for backfills", () => {
    const reports = parseCftcGoldDisaggregatedReports(
      [
        cftcRow("001602"),
        cftcRowForDate("2026-06-02"),
        cftcRowForDate("2026-05-26"),
      ].join("\n"),
    );

    expect(reports.map((report) => report.reportDate)).toEqual([
      "2026-05-26",
      "2026-06-02",
    ]);
    expect(buildCftcGoldObservations(reports[0])).toHaveLength(11);
  });

  it("fails closed when the Gold contract is absent", () => {
    expect(() => parseCftcGoldDisaggregatedCsv(cftcRow("001602"))).toThrow(
      "CFTC Gold COMEX contract 088691 was not found",
    );
  });

  it("parses one official annual ZIP without duplicate observation keys", () => {
    const payload = zipSync({
      "f_year.txt": strToU8(
        [
          cftcRowForDate("2025-01-07"),
          cftcRowForDate("2025-01-14"),
        ].join("\n"),
      ),
    });
    const result = parseCftcHistoricalArchive(payload, 2025);
    const keys = result.observations.map(
      (observation) =>
        `${observation.sourceKey}:${observation.seriesKey}:${observation.observedAt}`,
    );

    expect(result.reports).toHaveLength(2);
    expect(result.observations).toHaveLength(20);
    expect(new Set(keys).size).toBe(keys.length);
    expect(result.observations[0].sourceUrl).toBe(
      "https://www.cftc.gov/files/dea/history/fut_disagg_txt_2025.zip",
    );
  });

  it("only accepts CFTC archive years from 2009 through the current year", () => {
    expect(validateCftcHistoricalYear("2008", 2026)).toBeNull();
    expect(validateCftcHistoricalYear("2025", 2026)).toBe(2025);
    expect(validateCftcHistoricalYear("2027", 2026)).toBeNull();
  });
});

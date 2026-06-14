import { strToU8, zipSync } from "fflate";
import { describe, expect, it, vi } from "vitest";

import {
  buildGldHistoricalObservations,
  fetchGldGoldHoldings,
  parseGldHistoricalArchive,
  validateGldHistoricalYear,
} from "./gld-gold-holdings";

const headers = [
  "Date",
  "Closing Price",
  "Ounces of Gold per Share",
  "NAV/Share at 10:30am NYT",
  "Indicative Price per Share at 4:15pm NYT",
  "Mid point of bid/ask spread at 4:15pm NYT",
  "Premium/Discount of GLD Mid Point vs Indicative Value of GLD at 4:15pm NYT",
  "Daily Share Volume",
  "Total Ounces of Gold in the Trust",
  "Tonnes of Gold",
  "Total Net Asset Value in the Trust",
];

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildArchiveFixture(sheetName = "US GLD Historical Archive") {
  const rows = [
    [
      "09-Jun-2026",
      390.78,
      0.0917922,
      397.24,
      390.74,
      390.87,
      0.0322,
      9_567_301,
      32_681_327.11,
      1016.49,
      141_419_044_539.5,
    ],
    [
      "10-Jun-2026",
      374.58,
      0.09179084,
      382.86,
      374.4,
      374.68,
      0.0751,
      13_956_163,
      32_589_536.27,
      1013.64,
      135_913_531_902.03,
    ],
    [
      "11-Jun-2026",
      386.32,
      0.09178959,
      374.03,
      386.91,
      386.21,
      -0.1807,
      12_622_475,
      32_589_536.27,
      1013.64,
      132_780_222_324.9,
    ],
  ];
  const strings = [...headers, ...rows.map((row) => String(row[0]))];
  const sharedStrings = `<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${strings.map((value) => `<si><t>${xmlEscape(value)}</t></si>`).join("")}</sst>`;
  const headerCells = headers
    .map((_, index) => `<c r="${String.fromCharCode(65 + index)}1" t="s"><v>${index}</v></c>`)
    .join("");
  const dataRows = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const ref = `${String.fromCharCode(65 + columnIndex)}${rowIndex + 2}`;
          if (columnIndex === 0) {
            return `<c r="${ref}" t="s"><v>${headers.length + rowIndex}</v></c>`;
          }
          return `<c r="${ref}"><v>${value}</v></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 2}">${cells}</row>`;
    })
    .join("");

  return zipSync({
    "xl/workbook.xml": strToU8(
      `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    ),
    "xl/sharedStrings.xml": strToU8(sharedStrings),
    "xl/worksheets/sheet1.xml": strToU8(
      `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1">${headerCells}</row>${dataRows}</sheetData></worksheet>`,
    ),
  });
}

describe("GLD gold holdings ingestion", () => {
  it("parses consecutive issuer holdings observations", async () => {
    const report = await parseGldHistoricalArchive(buildArchiveFixture());

    expect(report.latest).toMatchObject({
      date: "2026-06-11",
      tonnes: 1013.64,
      totalOunces: 32_589_536.27,
    });
    expect(report.previous.date).toBe("2026-06-10");
    expect(report.history).toHaveLength(3);
  });

  it("returns a factual snapshot and issuer-backed evidence", async () => {
    const fixture = Buffer.from(buildArchiveFixture());
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(fixture, {
        status: 200,
        headers: {
          "content-type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      }),
    );

    const result = await fetchGldGoldHoldings(fetchFn);

    expect(result.status).toBe("success");
    if (result.status !== "success") return;

    expect(result.data).toMatchObject({
      key: "gld-gold-holdings",
      observedAt: "2026-06-11T00:00:00Z",
      dataQuality: "delayed",
      status: "neutral",
      change: "+0.00 tonnes",
    });
    expect(result.data.summary).toContain("not a reported capital-flow figure");
    expect(result.observations).toContainEqual(
      expect.objectContaining({
        sourceKey: "spdr-gold-shares",
        driverKey: "gld-gold-holdings",
        seriesKey: "gld_tonnes",
        numericValue: 1013.64,
        quality: "verified",
      }),
    );
  });

  it("fails when the issuer workbook schema changes", async () => {
    await expect(
      parseGldHistoricalArchive(buildArchiveFixture("Unexpected Sheet")),
    ).rejects.toThrow("GLD worksheet not found");
  });

  it("builds bounded historical observations with consecutive change provenance", async () => {
    const report = await parseGldHistoricalArchive(buildArchiveFixture());
    const observations = buildGldHistoricalObservations(report, 2026);

    expect(observations).toHaveLength(11);
    expect(observations).toContainEqual(
      expect.objectContaining({
        seriesKey: "gld_holdings_change_tonnes",
        observedAt: "2026-06-10T00:00:00Z",
        numericValue: expect.closeTo(-2.85, 8),
        metadata: expect.objectContaining({
          changeBasisDate: "2026-06-09",
          historicalArchiveYear: 2026,
        }),
      }),
    );
  });

  it("validates one historical year per bounded request", () => {
    expect(validateGldHistoricalYear(2004, 2026)).toBe(2004);
    expect(validateGldHistoricalYear("2026", 2026)).toBe(2026);
    expect(validateGldHistoricalYear(2003, 2026)).toBeNull();
    expect(validateGldHistoricalYear(2027, 2026)).toBeNull();
  });
});

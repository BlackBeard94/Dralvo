import { describe, expect, it, vi } from "vitest";
import { utils, write } from "xlsx";

import {
  fetchComexGoldInventory,
  parseComexGoldInventoryPayload,
  parseComexGoldInventoryReport,
} from "./comex-gold-inventory";

const markdownFixture = `
| GOLD | | | | | | Report Date: 6/11/2026 | |
| Troy Ounce | | | | | | Activity Date: 6/10/2026 | |
| DEPOSITORY | | PREV TOTAL | RECEIVED | WITHDRAWN | NET CHANGE | ADJUSTMENT | TOTAL TODAY |
| TOTAL REGISTERED | | 15159048.986 | 0 | 0 | 0 | 253767.843 | 15412816.829 |
| TOTAL PLEDGED | | 1885555.82 | | | | | 1885555.82 |
| TOTAL ELIGIBLE | | 12921885.19 | 0 | 67151.709 | -67151.709 | -253767.843 | 12600965.638 |
| COMBINED TOTAL | | 28080934.176 | 0 | 67151.709 | -67151.709 | 0 | 28013782.467 |
`;

const htmlFixture = `
<table>
  <tr><td>GOLD</td><td></td><td></td><td></td><td></td><td></td><td>Report Date: 6/11/2026</td><td></td></tr>
  <tr><td>Troy Ounce</td><td></td><td></td><td></td><td></td><td></td><td>Activity Date: 6/10/2026</td><td></td></tr>
  <tr><td>DEPOSITORY</td><td></td><td>PREV TOTAL</td><td>RECEIVED</td><td>WITHDRAWN</td><td>NET CHANGE</td><td>ADJUSTMENT</td><td>TOTAL TODAY</td></tr>
  <tr><td>TOTAL REGISTERED</td><td></td><td>15159048.986</td><td>0</td><td>0</td><td>0</td><td>253767.843</td><td>15412816.829</td></tr>
  <tr><td>TOTAL PLEDGED</td><td></td><td>1885555.82</td><td></td><td></td><td></td><td></td><td>1885555.82</td></tr>
  <tr><td>TOTAL ELIGIBLE</td><td></td><td>12921885.19</td><td>0</td><td>67151.709</td><td>-67151.709</td><td>-253767.843</td><td>12600965.638</td></tr>
  <tr><td>COMBINED TOTAL</td><td></td><td>28080934.176</td><td>0</td><td>67151.709</td><td>-67151.709</td><td>0</td><td>28013782.467</td></tr>
</table>
`;

describe("COMEX gold inventory ingestion", () => {
  it("parses CME markdown-like table rows", () => {
    expect(parseComexGoldInventoryReport(markdownFixture)).toMatchObject({
      reportDate: "2026-06-11",
      activityDate: "2026-06-10",
      registeredOunces: 15412816.829,
      registeredNetChangeOunces: 0,
      pledgedOunces: 1885555.82,
      eligibleOunces: 12600965.638,
      eligibleNetChangeOunces: -67151.709,
      combinedTotalOunces: 28013782.467,
    });
  });

  it("parses HTML table rows from XLS content", () => {
    expect(parseComexGoldInventoryReport(htmlFixture)).toMatchObject({
      reportDate: "2026-06-11",
      activityDate: "2026-06-10",
      registeredOunces: 15412816.829,
      eligibleOunces: 12600965.638,
    });
  });

  it("parses the legacy BIFF8 XLS payload published by CME", () => {
    const rows = [
      ["GOLD", "", "", "", "", "", "Report Date: 6/11/2026", ""],
      ["Troy Ounce", "", "", "", "", "", "Activity Date: 6/10/2026", ""],
      [
        "DEPOSITORY",
        "",
        "PREV TOTAL",
        "RECEIVED",
        "WITHDRAWN",
        "NET CHANGE",
        "ADJUSTMENT",
        "TOTAL TODAY",
      ],
      ["TOTAL REGISTERED", "", 15159048.986, 0, 0, 0, 253767.843, 15412816.829, ""],
      ["TOTAL PLEDGED", "", 1885555.82, "", "", "", "", 1885555.82, ""],
      ["TOTAL ELIGIBLE", "", 12921885.19, 0, 67151.709, -67151.709, -253767.843, 12600965.638, ""],
      ["COMBINED TOTAL", "", 28080934.176, 0, 67151.709, -67151.709, 0, 28013782.467, ""],
    ];
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, utils.aoa_to_sheet(rows), "Gold Stocks");
    const payload = write(workbook, { type: "array", bookType: "xls" });

    expect(parseComexGoldInventoryPayload(payload)).toMatchObject({
      reportDate: "2026-06-11",
      activityDate: "2026-06-10",
      registeredOunces: 15412816.829,
      eligibleOunces: 12600965.638,
      combinedTotalOunces: 28013782.467,
    });
  });

  it("returns a factual snapshot and traceable evidence observations", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(htmlFixture, { status: 200 }));

    const result = await fetchComexGoldInventory(fetchFn);

    expect(result.status).toBe("success");
    if (result.status !== "success") return;

    expect(result.data).toMatchObject({
      key: "comex-gold-inventory",
      observedAt: "2026-06-10T00:00:00Z",
      dataQuality: "delayed",
      status: "neutral",
    });
    expect(result.observations).toContainEqual(
      expect.objectContaining({
        driverKey: "comex-gold-inventory",
        seriesKey: "registered_ounces",
        numericValue: 15412816.829,
        quality: "verified",
      }),
    );
    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining("Gold_Stocks.xls"),
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          referer: expect.stringContaining("registrar-reports.html"),
          "accept-language": "en-US,en;q=0.9",
          "user-agent": expect.stringContaining("Mozilla/5.0"),
        }),
      }),
    );
  });
});

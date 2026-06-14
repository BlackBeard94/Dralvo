import { describe, expect, it } from "vitest";

import {
  buildSourceHealthAlert,
  parseOpsEmailRecipients,
  summarizeSourceHealth,
} from "@/lib/monitoring/source-alerts";
import type { FreshnessReport } from "@/lib/monitoring/freshness";

const report: FreshnessReport = {
  overall: "failed",
  ingest: {
    status: "failed",
    age_minutes: 10,
    last_error: "CME parser failed",
  },
  alert_evaluator: {
    status: "healthy",
    age_minutes: 5,
    last_error: null,
  },
  data_snapshots: {
    status: "healthy",
    age_minutes: 5,
    missing_keys: [],
    stale_keys: [],
  },
  evidence_sources: {
    status: "failed",
    drivers: {
      "comex-gold-inventory": {
        status: "failed",
        age_minutes: 6000,
        missing_series: [],
        stale_series: ["registered_ounces"],
        methodology_version: "comex-gold-inventory.v1",
        source_url: "https://example.com",
      },
    },
  },
};

describe("source health alerts", () => {
  it("parses comma-separated ops recipients", () => {
    expect(parseOpsEmailRecipients(" a@example.com, ,b@example.com ")).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("summarizes non-healthy source status", () => {
    expect(summarizeSourceHealth(report)).toContain(
      "comex-gold-inventory=failed (stale=registered_ounces, age=6000m)",
    );
  });

  it("builds email and telegram-safe alert content", () => {
    const alert = buildSourceHealthAlert(report);

    expect(alert.subject).toBe("[Dralvo] Source health FAILED");
    expect(alert.text).toContain("CME parser failed");
    expect(alert.html).toContain("Dralvo Source Health FAILED");
  });
});
